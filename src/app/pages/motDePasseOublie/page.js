'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, KeyRound, ArrowRight, ArrowLeft } from 'lucide-react'
import {
  Page, Carte, Marque, Titre, Intro, Champ, Etiquette, Saisie,
  Bouton, Erreur, Succes, PiedDePage, Lien
} from '@/components/styleJeton'

/* =====================================================================
   Demande de lien de réinitialisation

   LE MESSAGE DE CONFIRMATION NE DIT PAS SI LE COMPTE EXISTE

   C'est délibéré, et cela vient du serveur : la route répond la même
   chose dans tous les cas. Annoncer « aucun compte avec cette adresse »
   ferait de ce formulaire un moyen d'apprendre qui est inscrit sur la
   plateforme — sur un site d'étudiants en recherche de stage, ce n'est
   pas une information anodine.

   L'interface doit donc rester cohérente avec ce choix : après envoi,
   elle affiche la confirmation neutre plutôt que de laisser croire que
   le message a forcément été expédié.
   ===================================================================== */
export default function MotDePasseOublie() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [confirmation, setConfirmation] = useState('')

  const soumettre = async (e) => {
    e.preventDefault()
    setErreur('')
    setEnvoi(true)
    try {
      const res = await fetch('/api/motDePasse/demande', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Demande impossible')
      setConfirmation(data.message)
    } catch (err) {
      setErreur(err.message)
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <Page>
      <Carte>
        <Marque><KeyRound size={18} strokeWidth={2.5} /> Stage Share</Marque>

        {confirmation ? (
          <>
            <Titre>Demande enregistrée</Titre>
            <Succes>
              <CheckCircle2 size={16} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
              {confirmation}
            </Succes>
            <Intro>
              Le lien reste valable une heure et ne peut servir qu&apos;une seule fois.
              Sans courriel d&apos;ici quelques minutes, vérifiez l&apos;adresse saisie
              puis renouvelez la demande.
            </Intro>
            <Bouton onClick={() => router.push('/pages/etudiantLogin')}>
              <ArrowLeft size={16} strokeWidth={2.5} />
              Retour à la connexion
            </Bouton>
          </>
        ) : (
          <>
            <Titre>Mot de passe oublié</Titre>
            <Intro>
              Indiquez l&apos;adresse électronique de votre compte. Nous vous enverrons
              un lien pour choisir un nouveau mot de passe.
            </Intro>

            {erreur && (
              <Erreur>
                <AlertCircle size={16} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                {erreur}
              </Erreur>
            )}

            <form onSubmit={soumettre}>
              <Champ>
                <Etiquette htmlFor="email">Adresse électronique</Etiquette>
                <Saisie
                  id="email" type="email" value={email} autoComplete="email"
                  placeholder="prenom.nom@exemple.mg"
                  onChange={(e) => setEmail(e.target.value)} required
                />
              </Champ>

              <Bouton type="submit" disabled={envoi}>
                {envoi ? 'Envoi en cours...' : 'Recevoir un lien'}
                {!envoi && <ArrowRight size={16} strokeWidth={2.5} />}
              </Bouton>
            </form>
          </>
        )}

        <PiedDePage>
          <Lien onClick={() => router.push('/pages/etudiantLogin')}>Retour à la connexion</Lien>
        </PiedDePage>
      </Carte>
    </Page>
  )
}
