'use client'
import { useState, useEffect } from 'react'
import { fetchAuth } from '@/lib/auth'
import { X, KeyRound, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import {
  PwdBackdrop, PwdCard, PwdCloseButton,
  PwdHeader, PwdTitle, PwdSubtitle,
  PwdForm, PwdField, PwdLabel, PwdInputWrapper, PwdInput, PwdToggleEye,
  PwdHelper, PwdButtons, PwdSubmitButton, PwdCancelButton,
  PwdAlert, PwdAlertIcon
} from '@/components/styleChangerMotDePasseModal'

export default function ChangerMotDePasseModal({ onClose }) {
  const [ancien, setAncien] = useState('')
  const [nouveau, setNouveau] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Afficher / cacher chaque mot de passe
  const [showAncien, setShowAncien] = useState(false)
  const [showNouveau, setShowNouveau] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Fermeture par Echap + blocage du scroll de la page
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [onClose])

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

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
      setError("Le nouveau mot de passe doit être différent de l'ancien")
      return
    }

    setLoading(true)
    try {
      const res = await fetchAuth('/api/etudiantChangerMotDePasse', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ancienMotDePasse: ancien,
          nouveauMotDePasse: nouveau
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')

      setSuccess('Mot de passe modifié avec succès.')
      setAncien(''); setNouveau(''); setConfirmation('')

      // Fermeture automatique du modal apres le message de succes
      setTimeout(() => onClose(), 1800)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PwdBackdrop onClick={handleBackdropClick}>
      <PwdCard>
        <PwdCloseButton onClick={onClose} aria-label="Fermer">
          <X size={16} strokeWidth={2.5} />
        </PwdCloseButton>

        <PwdHeader>
          <PwdTitle>
            <KeyRound size={21} strokeWidth={2} />
            Changer mon mot de passe
          </PwdTitle>
          <PwdSubtitle>
            Pour des raisons de sécurité, veuillez saisir votre ancien mot de passe.
          </PwdSubtitle>
        </PwdHeader>

        {error && (
          <PwdAlert $type="error">
            <PwdAlertIcon><AlertCircle size={16} strokeWidth={2} /></PwdAlertIcon>
            {error}
          </PwdAlert>
        )}
        {success && (
          <PwdAlert $type="success">
            <PwdAlertIcon><CheckCircle2 size={16} strokeWidth={2} /></PwdAlertIcon>
            {success}
          </PwdAlert>
        )}

        <PwdForm onSubmit={handleSubmit}>
          <PwdField>
            <PwdLabel>Ancien mot de passe *</PwdLabel>
            <PwdInputWrapper>
              <PwdInput
                type={showAncien ? 'text' : 'password'}
                value={ancien}
                onChange={(e) => setAncien(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
              <PwdToggleEye
                type="button"
                onClick={() => setShowAncien(!showAncien)}
                aria-label={showAncien ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}
              >
                {showAncien
                  ? <EyeOff size={16} strokeWidth={2} />
                  : <Eye size={16} strokeWidth={2} />}
              </PwdToggleEye>
            </PwdInputWrapper>
          </PwdField>

          <PwdField>
            <PwdLabel>Nouveau mot de passe *</PwdLabel>
            <PwdInputWrapper>
              <PwdInput
                type={showNouveau ? 'text' : 'password'}
                value={nouveau}
                onChange={(e) => setNouveau(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                minLength={6}
              />
              <PwdToggleEye
                type="button"
                onClick={() => setShowNouveau(!showNouveau)}
                aria-label={showNouveau ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}
              >
                {showNouveau
                  ? <EyeOff size={16} strokeWidth={2} />
                  : <Eye size={16} strokeWidth={2} />}
              </PwdToggleEye>
            </PwdInputWrapper>
            <PwdHelper>Au moins 6 caractères.</PwdHelper>
          </PwdField>

          <PwdField>
            <PwdLabel>Confirmer le nouveau mot de passe *</PwdLabel>
            <PwdInputWrapper>
              <PwdInput
                type={showConfirm ? 'text' : 'password'}
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
              <PwdToggleEye
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}
              >
                {showConfirm
                  ? <EyeOff size={16} strokeWidth={2} />
                  : <Eye size={16} strokeWidth={2} />}
              </PwdToggleEye>
            </PwdInputWrapper>
          </PwdField>

          <PwdButtons>
            <PwdCancelButton type="button" onClick={onClose} disabled={loading}>
              Annuler
            </PwdCancelButton>
            <PwdSubmitButton type="submit" disabled={loading}>
              {loading ? (
                'Modification...'
              ) : (
                <>
                  <KeyRound size={15} strokeWidth={2} />
                  Modifier
                </>
              )}
            </PwdSubmitButton>
          </PwdButtons>
        </PwdForm>
      </PwdCard>
    </PwdBackdrop>
  )
}