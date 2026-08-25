'use client'
import { useState, useEffect, useCallback } from 'react'
import { fetchAuth } from '@/lib/auth'
import {
  Sparkles, RefreshCw, MapPin, Clock, Target,
  CheckCircle2, ArrowRight, Compass, AlertCircle
} from 'lucide-react'
import {
  RecoSection, RecoHeader, RecoTitleGroup, RecoTitle, RecoSubtitle,
  RecoRefreshButton,
  RecoScroll, RecoCard, RecoScoreBadge,
  RecoCompanyRow, RecoCompanyLogo, RecoCompanyName,
  RecoOfferTitle, RecoMeta, RecoMetaItem,
  RecoReasons, RecoReasonChip, RecoButton,
  RecoLoadingRow, RecoSkeleton,
  RecoEmpty, RecoEmptyLink
} from '@/components/styleRecommandations'

export default function Recommandations({ onVoirDetails, onCompleterProfil }) {
  const [recommandations, setRecommandations] = useState([])
  const [profilComplet, setProfilComplet] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const chargerRecommandations = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const res = await fetchAuth('/api/recommandations')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur de chargement')

      setRecommandations(data.recommandations || [])
      setProfilComplet(data.profilComplet || null)
    } catch (err) {
      console.error('Erreur recommandations:', err)
      setError(err.message)
      setRecommandations([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    chargerRecommandations()
  }, [chargerRecommandations])

  const formatDate = (date) => {
    if (!date) return 'Non spécifiée'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
    })
  }

  /* Message adapte : on dit a l'etudiant ce qui manque reellement
     dans son profil plutot qu'un texte generique. */
  const messageProfil = () => {
    if (!profilComplet) return null
    const manques = []
    if (!profilComplet.aCompetences) manques.push('vos compétences')
    if (!profilComplet.aPreferences) manques.push('vos préférences de stage')
    if (!profilComplet.aInterets) manques.push("vos centres d'intérêt")

    if (manques.length === 0) return null
    if (manques.length === 1) return `Renseignez ${manques[0]} pour affiner vos recommandations.`
    return `Renseignez ${manques.slice(0, -1).join(', ')} et ${manques.at(-1)} pour affiner vos recommandations.`
  }

  // Une erreur ne doit pas casser la page : la section disparait simplement
  if (error && !isLoading) return null

  return (
    <RecoSection>
      <RecoHeader>
        <RecoTitleGroup>
          <RecoTitle>
            <Sparkles size={21} strokeWidth={2} />
            Recommandé pour vous
          </RecoTitle>
          <RecoSubtitle>
            Les offres qui correspondent le mieux à votre profil et à vos compétences.
          </RecoSubtitle>
        </RecoTitleGroup>

        <RecoRefreshButton onClick={chargerRecommandations} disabled={isLoading}>
          <RefreshCw size={14} strokeWidth={2.2} />
          Actualiser
        </RecoRefreshButton>
      </RecoHeader>

      {isLoading ? (
        <RecoLoadingRow>
          <RecoSkeleton />
          <RecoSkeleton />
          <RecoSkeleton />
        </RecoLoadingRow>
      ) : recommandations.length === 0 ? (
        <RecoEmpty>
          <Compass size={34} strokeWidth={1.6} />
          <strong>Pas encore de recommandation</strong>
          <span>
            {messageProfil() ||
              "Aucune offre ne correspond suffisamment à votre profil pour le moment. Revenez bientôt : de nouvelles offres sont publiées régulièrement."}
          </span>
          {onCompleterProfil && messageProfil() && (
            <RecoEmptyLink onClick={onCompleterProfil}>
              Compléter mon profil
              <ArrowRight size={14} strokeWidth={2.5} />
            </RecoEmptyLink>
          )}
        </RecoEmpty>
      ) : (
        <>
          <RecoScroll>
            {recommandations.map((offre) => (
              <RecoCard key={offre.idOffre}>
                <RecoScoreBadge>
                  <Target size={12} strokeWidth={2.5} />
                  {offre.score}%
                </RecoScoreBadge>

                <RecoCompanyRow>
                  <RecoCompanyLogo>
                    {offre.logoEntreprise ? (
                      <img src={offre.logoEntreprise} alt={offre.nomEntreprise} />
                    ) : (
                      offre.nomEntreprise?.charAt(0).toUpperCase()
                    )}
                  </RecoCompanyLogo>
                  <RecoCompanyName>{offre.nomEntreprise}</RecoCompanyName>
                </RecoCompanyRow>

                <RecoOfferTitle>{offre.titre}</RecoOfferTitle>

                <RecoMeta>
                  <RecoMetaItem>
                    <MapPin size={13} strokeWidth={2} />
                    {offre.ville || 'Non spécifiée'}
                  </RecoMetaItem>
                  <RecoMetaItem>
                    <Clock size={13} strokeWidth={2} />
                    Limite : {formatDate(offre.dateLimite || offre.dateLimites)}
                  </RecoMetaItem>
                </RecoMeta>

                {offre.raisons?.length > 0 && (
                  <RecoReasons>
                    {offre.raisons.map((r, i) => (
                      <RecoReasonChip key={i} $fort={r.fort}>
                        <CheckCircle2 size={11} strokeWidth={2.5} />
                        {r.texte}
                      </RecoReasonChip>
                    ))}
                  </RecoReasons>
                )}

                <RecoButton onClick={() => onVoirDetails?.(offre)}>
                  Voir les détails
                  <ArrowRight size={14} strokeWidth={2.5} />
                </RecoButton>
              </RecoCard>
            ))}
          </RecoScroll>

          {/* Rappel discret quand le profil est incomplet malgre des resultats */}
          {messageProfil() && onCompleterProfil && (
            <RecoEmptyLink onClick={onCompleterProfil}>
              <AlertCircle size={14} strokeWidth={2} />
              {messageProfil()}
            </RecoEmptyLink>
          )}
        </>
      )}
    </RecoSection>
  )
}