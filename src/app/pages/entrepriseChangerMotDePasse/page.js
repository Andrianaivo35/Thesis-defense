'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAuth } from '@/lib/auth'
import AppNavbar from '@/components/appNavbar'
import {
  PwdContainer, PwdCard, PwdHeader, PwdTitle, PwdSubtitle,
  PwdForm, PwdField, PwdLabel, PwdInput,
  PwdHelper, PwdButtons, PwdSubmitButton, PwdCancelButton,
  PwdAlert, PwdBack
} from '@/components/styleEntrepriseChangerMotDePasse'

export default function EntrepriseChangerMotDePassePage() {
  const router = useRouter()
  const [ancien, setAncien] = useState('')
  const [nouveau, setNouveau] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (nouveau !== confirmation) {
      setError('Le nouveau mot de passe et sa confirmation ne correspondent pas')
      return
    }
    if (nouveau.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères')
      return
    }
    if (ancien === nouveau) {
      setError('Le nouveau mot de passe doit être différent de l\'ancien')
      return
    }

    setLoading(true)
    try {
      const res = await fetchAuth('/api/entrepriseChangerMotDePasse', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ancienMotDePasse: ancien,
          nouveauMotDePasse: nouveau
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')

      setSuccess('✓ Mot de passe modifié avec succès. Vous allez être redirigé...')
      setAncien(''); setNouveau(''); setConfirmation('')

      setTimeout(() => router.push('/pages/entrepriseModifierProfil'), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <AppNavbar />
      <PwdContainer>
        <PwdBack onClick={() => router.back()}>← Modification profil</PwdBack>

        <PwdCard>
          <PwdHeader>
            <PwdTitle>🔐 Changer mon mot de passe</PwdTitle>
            <PwdSubtitle>
              Pour des raisons de sécurité, veuillez saisir votre ancien mot de passe.
            </PwdSubtitle>
          </PwdHeader>

          {error && <PwdAlert $type="error">❌ {error}</PwdAlert>}
          {success && <PwdAlert $type="success">{success}</PwdAlert>}

          <PwdForm onSubmit={handleSubmit}>
            <PwdField>
              <PwdLabel>Ancien mot de passe *</PwdLabel>
              <PwdInput
                type="password"
                value={ancien}
                onChange={(e) => setAncien(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </PwdField>

            <PwdField>
              <PwdLabel>Nouveau mot de passe *</PwdLabel>
              <PwdInput
                type="password"
                value={nouveau}
                onChange={(e) => setNouveau(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                minLength={6}
              />
              <PwdHelper>Au moins 6 caractères.</PwdHelper>
            </PwdField>

            <PwdField>
              <PwdLabel>Confirmer le nouveau mot de passe *</PwdLabel>
              <PwdInput
                type="password"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </PwdField>

            <PwdButtons>
              <PwdCancelButton type="button" onClick={() => router.back()} disabled={loading}>
                Annuler
              </PwdCancelButton>
              <PwdSubmitButton type="submit" disabled={loading}>
                {loading ? 'Modification...' : '🔐 Modifier'}
              </PwdSubmitButton>
            </PwdButtons>
          </PwdForm>
        </PwdCard>
      </PwdContainer>
    </>
  )
}