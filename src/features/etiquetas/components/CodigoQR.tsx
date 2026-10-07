import QRCode from 'qrcode'
import { useEffect, useState } from 'react'

interface CodigoQRProps {
  codigo: string
  tamano?: number
}

export function CodigoQR({ codigo, tamano = 80 }: CodigoQRProps) {
  const [dataUrl, setDataUrl] = useState<string>('')

  useEffect(() => {
    if (!codigo) return
    void QRCode.toDataURL(codigo, {
      width: tamano * 2,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then(setDataUrl)
      .catch(() => {})
  }, [codigo, tamano])

  if (!dataUrl) {
    return (
      <div
        style={{ width: tamano, height: tamano }}
        className="bg-gray-100 flex items-center justify-center text-xs"
        aria-hidden
      />
    )
  }

  return (
    <img
      src={dataUrl}
      alt={`Código QR para ${codigo}`}
      style={{ width: tamano, height: tamano }}
      className="shrink-0"
    />
  )
}
