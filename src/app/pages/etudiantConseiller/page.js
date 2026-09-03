'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAuth } from '@/lib/auth'
import AppNavbar from '@/components/appNavbar'
import {
  Lightbulb, TrendingUp, Target, Info, ArrowRight, Sparkles, GraduationCap
} from 'lucide-react'
import {
  PageContainer, PageHeader, PageTitle, PageSubtitle,
  StatsRow, StatCard, StatValue, StatLabel,
  CandidatureList, CandidatureCard, CardHeader,
  OffreTitre, EntrepriseNom, ScoreBadge,
  CardMeta, MetaItem, CardFooter, ActionButton,
  EmptyState, LoadingState
} from '@/components/styleEtudiantCandidature'

export default function EtudiantConseiller() {
  const router = useRouter()
  const [donnees, setDonnees] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    const charger = async () => {
      try {
        const res = await fetchAuth('/api/conseiller')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Chargement impossible')
        setDonnees(data)
      } catch (err) {
        setErreur(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    charger()
  }, [])

  const situation = donnees?.situationActuelle
  const suggestions = donnees?.suggestions || []

  return (
    <>
      <AppNavbar />
      <PageContainer>
        <PageHeader>
          <PageTitle>
            <Lightbulb size={24} strokeWidth={2} />
            Que puis-je apprendre ?
          </PageTitle>
          <PageSubtitle>
            Nous simulons l&apos;ajout de chaque compétence à votre profil et mesurons
            son effet réel sur les offres qui vous sont accessibles.
          </PageSubtitle>
        </PageHeader>

        {isLoading ? (
          <LoadingState>Analyse de votre profil en cours...</LoadingState>
        ) : erreur ? (
          <EmptyState>{erreur}</EmptyState>
        ) : !situation ? (
          <EmptyState>
            <p>Aucune offre disponible à analyser pour le moment.</p>
          </EmptyState>
        ) : (
          <>
            {/* === Situation actuelle === */}
            <StatsRow>
              <StatCard>
                <StatValue>{situation.nombreCompetences}</StatValue>
                <StatLabel>Compétences déclarées</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{situation.offresPrometteuses}</StatValue>
                <StatLabel>Offres prometteuses</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{situation.offresEligibles}</StatValue>
                <StatLabel>Offres accessibles</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{situation.scoreMoyen}</StatValue>
                <StatLabel>Score de vos meilleures offres</StatLabel>
              </StatCard>
            </StatsRow>

            {situation.nombreCompetences === 0 && (
              <EmptyState style={{ marginBottom: 20 }}>
                <p>Vous n&apos;avez déclaré aucune compétence.</p>
                <p>
                  <ActionButton onClick={() => router.push('/pages/etudiantModifierProfil')}>
                    <GraduationCap size={13} strokeWidth={2} />
                    Compléter mon profil
                  </ActionButton>
                </p>
              </EmptyState>
            )}

            <PageTitle style={{ fontSize: 19 }}>
              <TrendingUp size={19} strokeWidth={2} />
              Compétences à acquérir en priorité
            </PageTitle>

            {suggestions.length === 0 ? (
              <EmptyState>
                Aucune compétence supplémentaire ne modifierait sensiblement votre
                situation actuelle. Votre profil couvre déjà bien les offres disponibles.
              </EmptyState>
            ) : (
              <CandidatureList>
                {suggestions.map((s, index) => (
                  <CandidatureCard key={s.idCompetenceReference}>
                    <CardHeader>
                      <div>
                        <OffreTitre>{s.competence}</OffreTitre>
                        <EntrepriseNom>
                          <Target size={14} strokeWidth={2} />
                          {s.categorie || 'Compétence'}
                        </EntrepriseNom>
                      </div>
                      <ScoreBadge>
                        {index === 0 && <Sparkles size={13} strokeWidth={2.5} />}
                        +{s.offresDebloquees} offre{s.offresDebloquees > 1 ? 's' : ''}
                      </ScoreBadge>
                    </CardHeader>

                    <CardMeta>
                      <MetaItem>
                        <TrendingUp size={13} strokeWidth={2} />
                        Score de vos meilleures offres : {situation.scoreMoyen}
                        {' → '}
                        <strong>{s.scoreMoyenApres}</strong>
                        {s.gainScoreMoyen > 0 && ` (+${s.gainScoreMoyen})`}
                      </MetaItem>
                    </CardMeta>

                    {s.exemplesOffres.length > 0 && (
                      <CardMeta style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                        <MetaItem style={{ fontWeight: 600, color: '#475569' }}>
                          Offres que cette compétence vous ouvrirait :
                        </MetaItem>
                        {s.exemplesOffres.map(o => (
                          <MetaItem key={o.idOffre} style={{ paddingLeft: 8 }}>
                            • {o.titre} — {o.nomEntreprise} ({o.score})
                          </MetaItem>
                        ))}
                      </CardMeta>
                    )}

                    <CardFooter>
                      <MetaItem>
                        <Info size={13} strokeWidth={2} />
                        Simulation à un niveau « {donnees.niveauSimule} »
                      </MetaItem>
                      <ActionButton onClick={() => router.push('/pages/listeOffre')}>
                        Voir les offres
                        <ArrowRight size={13} strokeWidth={2.5} />
                      </ActionButton>
                    </CardFooter>
                  </CandidatureCard>
                ))}
              </CandidatureList>
            )}

            <EmptyState style={{ marginTop: 24, textAlign: 'left' }}>
              <p style={{ fontWeight: 600, color: '#475569' }}>Comment ces conseils sont calculés</p>
              <p>
                Pour chaque compétence que vous ne possédez pas encore, votre profil est
                réévalué comme si vous la maîtrisiez, sur l&apos;ensemble des offres
                disponibles. Seules sont comptées les offres devenant de véritables
                opportunités — pas celles franchissant tout juste le seuil d&apos;affichage.
              </p>
            </EmptyState>
          </>
        )}
      </PageContainer>
    </>
  )
}
