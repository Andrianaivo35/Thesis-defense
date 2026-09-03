'use client'
import { useState, useEffect } from 'react'
import { getUtilisateur } from '@/lib/auth'
import EtudiantNavbar from '@/components/etudiantNavbar'
import EntrepriseNavbar from '@/components/entrepriseNavbar'
import UniversiteNavbar from '@/components/universiteNavbar'

export default function AppNavbar() {
  const [user, setUser] = useState(null)
  const [monte, setMonte] = useState(false)

  useEffect(() => {
    setUser(getUtilisateur())
    setMonte(true)
  }, [])

  // Premier rendu : identique au serveur (rien), donc pas d'erreur d'hydratation
  if (!monte) return null

  if (!user) return null

  // Les rôles traités ici doivent rester synchronisés avec
  // ROLES_AVEC_SIDEBAR (lib/auth.js), que AppLayout utilise pour réserver
  // la largeur de la barre latérale — un rôle ajouté ici sans y être ajouté
  // aussi le rendrait soit sans barre visible, soit avec une largeur non
  // réservée pour lui.
  switch (user.typeUtilisateur) {
    case 'Etudiant':
      return <EtudiantNavbar />
    case 'Entreprise':
      return <EntrepriseNavbar />
    case 'Universite':
      return <UniversiteNavbar />
    default:
      return null
  }
}