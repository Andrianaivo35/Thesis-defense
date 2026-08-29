'use client'
import { Suspense } from 'react'
import FormulaireJeton from '@/components/formulaireJeton'
import { Chargement } from '@/components/styleJeton'

export default function ReinitialiserMotDePasse() {
  return (
    <Suspense fallback={<Chargement>Chargement...</Chargement>}>
      <FormulaireJeton
        type="reinitialisation"
        titre="Nouveau mot de passe"
        intro="Choisissez un nouveau mot de passe. L'ancien cessera immédiatement de fonctionner."
        libelleBouton="Enregistrer le mot de passe"
      />
    </Suspense>
  )
}
