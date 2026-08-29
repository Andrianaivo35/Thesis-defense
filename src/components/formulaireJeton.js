'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, CheckCircle2, KeyRound, ArrowRight, Mail } from 'lucide-react'
import {
  Page, Carte, Marque, Titre, Intro, Champ, Etiquette, Saisie,
  Bouton, Erreur, Succes, Info, Regle, PiedDePage, Lien, Chargement
} from '@/components/styleJeton'

/* =====================================================================
   Formulaire commun à l'activation de compte et à la réinitialisation

   Les deux écrans font la même chose : présenter un jeton, poser un mot
   de passe. Seuls le titre et le texte changent. Les écrire deux fois
   aurait garanti qu'ils divergent — l'un recevant une correction que
   l'autre n'aurait pas.

   LE LIEN EST VÉRIFIÉ AVANT D'AFFICHER LE FORMULAIRE

   Faire saisir deux fois un mot de passe pour annoncer ensuite que le
   lien avait expiré est une perte de temps évitable. La page interroge
   d'abord le serveur, puis affiche soit le formulaire, soit
   l'explication et le moyen d'obtenir un nouveau lien.
   ===================================================================== */

const CONNEXIONS = {
  Etudiant: '/pages/etudiantLogin',
  Entreprise: '/pages/entrepriseLogin',
  Universite: '/pages/universiteLogin',
  Admin: '/pages/adminLogin'
}

export default function FormulaireJeton({ type, titre, intro, libelleBouton }) {
  const router = useRouter()
  const jeton = useSearchParams().get('jeton')

  const [verification, setVerification] = useState({ etat: 'en_cours' })
  const [motDePasse, setMotDePasse] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [destination, setDestination] = useState('/pages/etudiantLogin')

  useEffect(() => {
    const verifier = async () => {
      if (!jeton) {
        setVerification({ etat: 'invalide', message: 'Ce lien est incomplet. Copiez-le entièrement depuis votre courriel.' })
        return
      }
      try {
        const res = await fetch(`/api/jeton?jeton=${encodeURIComponent(jeton)}&type=${type}`)
        const data = await res.json()
        if (data.valide) setVerification({ etat: 'valide', email: data.email })
        else setVerification({ etat: 'invalide', message: data.message })
      } catch {
        setVerification({ etat: 'invalide', message: 'Vérification impossible. Réessayez dans un instant.' })
      }
    }
    verifier()
  }, [jeton, type])

  const soumettre = async (e) => {
    e.preventDefault()
    setErreur('')

    /* La confirmation est comparée ici, avant l'appel : une faute de
       frappe ne doit pas coûter un aller-retour, et surtout pas
       consommer le lien. */
    if (motDePasse !== confirmation) {
      setErreur('Les deux mots de passe ne correspondent pas.')
      return
    }

    setEnvoi(true)
    try {
      const res = await fetch('/api/jeton', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jeton, type, motDePasse })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Opération impossible')

      setSucces(data.message)
      setDestination(CONNEXIONS[data.typeUtilisateur] || '/pages/etudiantLogin')
      setTimeout(() => router.push(CONNEXIONS[data.typeUtilisateur] || '/pages/etudiantLogin'), 2500)
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

        {verification.etat === 'en_cours' ? (
          <Chargement>Vérification du lien...</Chargement>

        ) : verification.etat === 'invalide' ? (
          <>
            <Titre>Ce lien ne fonctionne plus</Titre>
            <Erreur>
              <AlertCircle size={16} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
              {verification.message}
            </Erreur>
            <Info>
              <Mail size={16} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
              Vous pouvez demander un nouveau lien : il vous parviendra immédiatement
              et remplacera le précédent.
            </Info>
            <Bouton onClick={() => router.push('/pages/motDePasseOublie')}>
              Demander un nouveau lien
              <ArrowRight size={16} strokeWidth={2.5} />
            </Bouton>
          </>

        ) : succes ? (
          <>
            <Titre>C&apos;est fait</Titre>
            <Succes>
              <CheckCircle2 size={16} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
              {succes}
            </Succes>
            <Bouton onClick={() => router.push(destination)}>
              Aller à la connexion
              <ArrowRight size={16} strokeWidth={2.5} />
            </Bouton>
          </>

        ) : (
          <>
            <Titre>{titre}</Titre>
            <Intro>{intro}</Intro>

            {/* Afficher l'adresse concernée : plusieurs liens peuvent
                traîner dans une même boîte, et rien ne distingue
                autrement le compte que l'on est en train de modifier. */}
            <Info>
              <Mail size={16} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
              Compte concerné : <strong>&nbsp;{verification.email}</strong>
            </Info>

            {erreur && (
              <Erreur>
                <AlertCircle size={16} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                {erreur}
              </Erreur>
            )}

            <form onSubmit={soumettre}>
              <Champ>
                <Etiquette htmlFor="mdp">Nouveau mot de passe</Etiquette>
                <Saisie
                  id="mdp" type="password" value={motDePasse} autoComplete="new-password"
                  onChange={(e) => setMotDePasse(e.target.value)} required
                />
              </Champ>
              <Regle>
                Au moins 8 caractères, dont une majuscule, une minuscule et un chiffre.
              </Regle>

              <Champ>
                <Etiquette htmlFor="conf">Confirmez le mot de passe</Etiquette>
                <Saisie
                  id="conf" type="password" value={confirmation} autoComplete="new-password"
                  onChange={(e) => setConfirmation(e.target.value)} required
                />
              </Champ>

              <Bouton type="submit" disabled={envoi}>
                {envoi ? 'Enregistrement...' : libelleBouton}
                {!envoi && <ArrowRight size={16} strokeWidth={2.5} />}
              </Bouton>
            </form>
          </>
        )}

        <PiedDePage>
          Vous connaissez déjà vos identifiants ?{' '}
          <Lien onClick={() => router.push('/pages/etudiantLogin')}>Se connecter</Lien>
        </PiedDePage>
      </Carte>
    </Page>
  )
}
