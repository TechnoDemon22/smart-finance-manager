import React from 'react';
import {
  Utensils,
  Car,
  Film,
  ShoppingBag,
  FileText,
  HeartPulse,
  GraduationCap,
  MoreHorizontal,
  Home,
  Coffee,
  Plane,
  Gift,
  Smartphone,
  Wifi,
  Activity,
  Tag
} from 'lucide-react';

const iconMap = {
  Utensils,
  Car,
  Film,
  ShoppingBag,
  FileText,
  HeartPulse,
  GraduationCap,
  MoreHorizontal,
  Home,
  Coffee,
  Plane,
  Gift,
  Smartphone,
  Wifi,
  Activity,
  Tag
};

export default function CategoryIcon({ name = 'Tag', className = 'w-4 h-4', color }) {
  const IconComponent = iconMap[name] || Tag;
  return (
    <span
      className="inline-flex items-center justify-center rounded-lg p-1.5 transition-transform"
      style={{
        backgroundColor: color ? `${color}20` : 'rgba(100, 116, 139, 0.15)',
        color: color || '#94a3b8'
      }}
    >
      <IconComponent className={className} />
    </span>
  );
}
