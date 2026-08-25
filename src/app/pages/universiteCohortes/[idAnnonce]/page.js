'use client'
import { useParams } from 'next/navigation'
import FormulaireAnnonceCohorte from '@/components/formulaireAnnonceCohorte'

export default function ModifierAnnoncePage() {
  const { idAnnonce } = useParams()  
  return <FormulaireAnnonceCohorte idAnnonce={idAnnonce} />
}