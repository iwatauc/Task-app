'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppImage } from '@/lib/types'

type Point = { x: number; y: number }

export default function EditCanvas({ image }: { image: AppImage }) {
  const router = useRouter()
  const imgRef = useRef<HTMLImageElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [brush, setBrush] = useState(36)
  const [eraser, setEraser] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const [instruction, setInstruction] = useState('')
  const [status, setStatus] = useState('')
  const [natural, setNatural] = useState({ width: image.width || 1024, height: image.height || 1024 })

  const resizeCanvas = useCallback(() => {
    const img = imgRef.current
    const canvas = canvasRef.current
    if (!img || !canvas) return
    const rect = img.getBoundingClientRect()
    const temp = document.createElement('canvas')
    temp.width = canvas.width
    temp.height = canvas.height
    temp.getContext('2d')?.drawImage(canvas, 0, 0)
    canvas.width = Math.max(1, Math.round(rect.width))
    canvas.height = Math.max(1, Math.round(rect.height))
    const ctx = canvas.getContext('2d')
    if (ctx && temp.width > 0 && temp.height > 0) ctx.drawImage(temp, 0, 0, temp.width, temp.height, 0, 0, canvas.width, canvas.height)
  }, [])

  useEffect(() => {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [resizeCanvas])

  function point(event: React.PointerEvent<HTMLCanvasElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  function draw(from: Point, to: Point) {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = brush
    ctx.globalCompositeOperation = eraser ? 'destination-out' : 'source-over'
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.72)'
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
  }

  const last = useRef<Point | null>(null)

  function handleDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    const p = point(event)
    last.current = p
    setDrawing(true)
    draw(p, p)
  }

  function handleMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing || !last.current) return
    const next = point(event)
    draw(last.current, next)
    last.current = next
  }

  function handleUp() {
    setDrawing(false)
    last.current = null
  }

  function clear() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  async function createMaskAndOverlay() {
    const source = canvasRef.current
    if (!source) throw new Error('Canvas not ready')
    const overlay = document.createElement('canvas')
    overlay.width = natural.width
    overlay.height = natural.height
    const overlayCtx = overlay.getContext('2d')
    if (!overlayCtx) throw new Error('Canvas not ready')
    overlayCtx.drawImage(source, 0, 0, overlay.width, overlay.height)

    const mask = document.createElement('canvas')
    mask.width = natural.width
    mask.height = natural.height
    const maskCtx = mask.getContext('2d')
    if (!maskCtx) throw new Error('Canvas not ready')
    maskCtx.fillStyle = 'black'
    maskCtx.fillRect(0, 0, mask.width, mask.height)
    maskCtx.drawImage(source, 0, 0, mask.width, mask.height)
    const imageData = maskCtx.getImageData(0, 0, mask.width, mask.height)
    for (let i = 0; i < imageData.data.length; i += 4) {
      const a = imageData.data[i + 3]
      const painted = a > 10
      imageData.data[i] = painted ? 255 : 0
      imageData.data[i + 1] = painted ? 255 : 0
      imageData.data[i + 2] = painted ? 255 : 0
      imageData.data[i + 3] = 255
    }
    maskCtx.putImageData(imageData, 0, 0)

    return {
      overlayDataUrl: overlay.toDataURL('image/png'),
      maskDataUrl: mask.toDataURL('image/png'),
    }
  }

  async function submit() {
    if (!instruction.trim()) {
      setStatus('修正指示を入力してください。')
      return
    }
    setStatus('マスクを作成して編集しています…')
    try {
      const payload = await createMaskAndOverlay()
      const response = await fetch('/api/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId: image.id, instruction, ...payload }),
      })
      const json = await response.json()
      if (!response.ok) {
        setStatus(json.error || '編集に失敗しました')
        return
      }
      setStatus('修正版を保存しました。詳細へ移動します…')
      router.push(`/images/${json.image.id}`)
      router.refresh()
    } catch (error) {
      console.error(error)
      setStatus('マスク作成に失敗しました。')
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <div className="rounded-3xl border border-stone-200 bg-white p-3 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-5">
        <div className="relative mx-auto max-h-[72vh] w-full touch-none overflow-hidden rounded-2xl bg-stone-100 dark:bg-stone-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imgRef} onLoad={(event) => { setNatural({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight }); resizeCanvas() }} src={image.image_url} alt={image.title || '編集対象'} className="mx-auto block max-h-[72vh] w-full object-contain" />
          <canvas ref={canvasRef} onPointerDown={handleDown} onPointerMove={handleMove} onPointerUp={handleUp} onPointerCancel={handleUp} className="absolute left-0 top-0 h-full w-full cursor-crosshair touch-none" />
        </div>
      </div>
      <aside className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <h2 className="text-xl font-black">赤ペイントで修正範囲を指定</h2>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">赤く塗った範囲をマスクとして、元画像サイズに合わせた PNG を生成します。</p>
        <div className="mt-5 space-y-4">
          <label className="grid gap-2 text-sm font-bold">ブラシサイズ<input type="range" min="6" max="96" value={brush} onChange={(e) => setBrush(Number(e.target.value))} /> <span>{brush}px</span></label>
          <div className="flex gap-2"><button type="button" onClick={() => setEraser(false)} className={`rounded-full px-4 py-2 font-bold ${!eraser ? 'bg-red-500 text-white' : 'bg-stone-100 dark:bg-stone-800'}`}>赤ブラシ</button><button type="button" onClick={() => setEraser(true)} className={`rounded-full px-4 py-2 font-bold ${eraser ? 'bg-stone-950 text-white dark:bg-white dark:text-stone-950' : 'bg-stone-100 dark:bg-stone-800'}`}>消しゴム</button><button type="button" onClick={clear} className="rounded-full bg-stone-100 px-4 py-2 font-bold dark:bg-stone-800">全消し</button></div>
          <label className="grid gap-2 text-sm font-bold">修正指示<textarea value={instruction} onChange={(e) => setInstruction(e.target.value)} className="input min-h-32" placeholder="例: 右手の指を自然に、服の袖の流れを分かりやすく直したい" /></label>
          <button onClick={submit} className="w-full rounded-2xl bg-red-500 px-5 py-4 font-black text-white hover:bg-red-600">この範囲を修正</button>
          {status && <p className="text-sm text-stone-600 dark:text-stone-300">{status}</p>}
        </div>
      </aside>
    </div>
  )
}
