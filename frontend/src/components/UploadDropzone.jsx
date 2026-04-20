import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { cn } from '../lib/cn'

export function UploadDropzone({
  onFiles,
  accept,
  maxFiles = 1,
  helper = 'Drag & drop files here, or click to browse',
  className,
}) {
  const onDrop = useCallback(
    (accepted) => {
      onFiles?.(accepted)
    },
    [onFiles],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        'rounded-[var(--radius)] border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 shadow-card transition cursor-pointer',
        isDragActive
          ? 'ring-2 ring-[rgb(var(--ring))]'
          : 'hover:bg-[rgb(var(--bg-muted))]',
        className,
      )}
    >
      <input {...getInputProps()} />
      <div className="text-sm font-semibold">Upload</div>
      <div className="mt-1 text-sm text-muted">{helper}</div>
    </div>
  )
}

