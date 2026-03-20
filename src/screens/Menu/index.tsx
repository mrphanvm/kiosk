// src/screens/Menu/index.tsx
import React from 'react'
import HologramReceptionist from '../../components/HologramReceptionist'

interface MenuProps {
  onCheckin: () => void
}

const Menu: React.FC<MenuProps> = ({ onCheckin }) => {
  return <HologramReceptionist onCheckin={onCheckin} />
}

export default Menu
