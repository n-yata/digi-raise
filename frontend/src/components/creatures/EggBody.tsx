interface EggBodyProps {
  color: string
  size: number
}

export function EggBody({ color, size }: EggBodyProps) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: size,
        height: size * 1.2,
        background: `radial-gradient(ellipse at 40% 35%, white 0%, ${color}88 40%, ${color} 100%)`,
        borderRadius: '50% 50% 45% 45%',
        boxShadow: `0 0 20px ${color}88, inset 0 -10px 20px rgba(0,0,0,0.3)`,
      }}
    >
      <div
        className="absolute"
        style={{
          width: 12,
          height: 8,
          borderRadius: '50%',
          background: `${color}cc`,
          top: '35%',
          left: '20%',
        }}
      />
      <div
        className="absolute"
        style={{
          width: 8,
          height: 6,
          borderRadius: '50%',
          background: `${color}aa`,
          top: '55%',
          left: '60%',
        }}
      />
    </div>
  )
}
