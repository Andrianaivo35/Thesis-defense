'use client'
import { Suspense } from 'react'
import FormulaireJeton from '@/components/formulaireJeton'
import { Chargement } from '@/components/styleJeton'

/* useSearchParams impose une frontière Suspense : sans elle, la page
   entière bascule en rendu dynamique et le build échoue. */
export default function ActiverCompte() {
  return (
    <Suspense fallback={<Chargement>Chargement...</Chargement>}>
      <FormulaireJeton
        type="activation"
        titre="Activez votre compte"
        intro="Votre établissement a créé un compte à votre nom. Choisissez le mot de passe qui vous servira à vous connecter."
        libelleBouton="Activer mon compte"
      />
    </Suspense>
  )
}
