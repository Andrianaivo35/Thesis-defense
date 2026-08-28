'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAuth } from '@/lib/auth'
import AppNavbar from '@/components/appNavbar'
import {
  FileText, Building2, MapPin, Calendar, Clock, Award,
  CheckCircle2, XCircle, Hourglass, MessageSquare, BadgeCheck
} from 'lucide-react'
import {
  PageContainer, PageHeader, PageTitle, PageSubtitle,
  StatsRow, StatCard, StatValue, StatLabel,
  FiltersBar, FilterButton,
  CandidatureList, CandidatureCard, CardHeader,
  OffreTitre, EntrepriseNom, StatutBadge,
  CardMeta, MetaItem, CardFooter, NoteQCM, ActionButton,
  EmptyState, LoadingState
} from '@/components/styleEtudiantCandidature'

const FILTRES = [
  { cle: 'toutes', libelle: 'Toutes' },
  { cle: 'En attente', libelle: 'En attente' },
  { cle: 'Recruté', libelle: 'Retenues' },
  { cle: 'Refusé', libelle: 'Refusées' }
]

/* Icône associée au statut de la candidature */
function IconeStatut({ statut }) {
  if (statut === 'Recruté') return <CheckCircle2 size={13} strokeWidth={2.5} />
  if (statut === 'Refusé') return <XCircle size={13} strokeWidth={2.5} />
  return <Hourglass size={13} strokeWidth={2.5} />
}

/* Libellé affiché : « Recruté » est le statut technique, on préfère une
   formulation compréhensible côté étudiant. */
function libelleStatut(statut) {
  if (statut === 'Recruté') return 'Candidature retenue'
  if (statut === 'Refusé') return 'Non retenue'
  return 'En attente de réponse'
}

function formaterDate(valeur) {
  if (!valeur) return '—'
  return new Date(valeur).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
}

export default function EtudiantCandidatures() {
  const router = useRouter()
  const [candidatures, setCandidatures] = useState([])
  const [statistiques, setStatistiques] = useState({
    total: 0, enAttente: 0, recrutees: 0, refusees: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [filtre, setFiltre] = useState('toutes')

  useEffect(() => {
    const charger = async () => {
      try {
        const res = await fetchAuth('/api/etudiantCandidature')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Chargement impossible')
        setCandidatures(data.candidatures || [])
        setStatistiques(data.statistiques || {})
      } catch (err) {
        setErreur(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    charger()
  }, [])

  const candidaturesFiltrees = useMemo(() => {
    if (filtre === 'toutes') return candidatures
    return candidatures.filter(c => c.statut === filtre)
  }, [candidatures, filtre])

  return (
    <>
      <AppNavbar />
      <PageContainer>
        <PageHeader>
          <PageTitle>
            <FileText size={24} strokeWidth={2} />
            Mes candidatures
          </PageTitle>
          <PageSubtitle>
            Suivez l&apos;avancement des offres auxquelles vous avez postulé.
          </PageSubtitle>
        </PageHeader>

        {isLoading ? (
          <LoadingState>Chargement de vos candidatures...</LoadingState>
        ) : erreur ? (
          <EmptyState>{erreur}</EmptyState>
        ) : candidatures.length === 0 ? (
          <EmptyState>
            <p>Vous n&apos;avez encore postulé à aucune offre.</p>
            <p>
              <ActionButton onClick={() => router.push('/pages/listeOffre')}>
                Découvrir les offres
              </ActionButton>
            </p>
          </EmptyState>
        ) : (
          <>
            <StatsRow>
              <StatCard>
                <StatValue>{statistiques.total}</StatValue>
                <StatLabel>Candidatures</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{statistiques.enAttente}</StatValue>
                <StatLabel>En attente</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{statistiques.recrutees}</StatValue>
                <StatLabel>Retenues</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{statistiques.refusees}</StatValue>
                <StatLabel>Non retenues</StatLabel>
              </StatCard>
            </StatsRow>

            <FiltersBar>
              {FILTRES.map(f => (
                <FilterButton
                  key={f.cle}
                  $actif={filtre === f.cle}
                  onClick={() => setFiltre(f.cle)}
                >
                  {f.libelle}
                </FilterButton>
              ))}
            </FiltersBar>

            {candidaturesFiltrees.length === 0 ? (
              <EmptyState>
                Aucune candidature ne correspond à ce filtre.
              </EmptyState>
            ) : (
              <CandidatureList>
                {candidaturesFiltrees.map(c => (
                  <CandidatureCard key={c.idCandidature} $statut={c.statut}>
                    <CardHeader>
                      <div>
                        <OffreTitre>{c.titreOffre}</OffreTitre>
                        <EntrepriseNom>
                          <Building2 size={14} strokeWidth={2} />
                          {c.nomEntreprise}
                          {c.entrepriseVerifiee && (
                            <BadgeCheck size={14} strokeWidth={2} aria-label="Entreprise vérifiée" />
                          )}
                        </EntrepriseNom>
                      </div>
                      <StatutBadge $statut={c.statut}>
                        <IconeStatut statut={c.statut} />
                        {libelleStatut(c.statut)}
                      </StatutBadge>
                    </CardHeader>

                    <CardMeta>
                      <MetaItem>
                        <Calendar size={13} strokeWidth={2} />
                        Postulé le {formaterDate(c.dateCandidature)}
                      </MetaItem>
                      {c.ville && (
                        <MetaItem>
                          <MapPin size={13} strokeWidth={2} />
                          {c.ville}
                        </MetaItem>
                      )}
                      {c.duree && (
                        <MetaItem>
                          <Clock size={13} strokeWidth={2} />
                          {c.duree}
                        </MetaItem>
                      )}
                    </CardMeta>

                    <CardFooter>
                      {c.noteQCM !== null && c.noteQCM !== undefined ? (
                        <NoteQCM $reussi={Number(c.noteQCM) >= 50}>
                          <Award size={14} strokeWidth={2} />
                          Note au QCM : {Number(c.noteQCM).toFixed(0)} / 100
                        </NoteQCM>
                      ) : <span />}

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {c.idUtilisateurEntreprise && (
                          <ActionButton
                            onClick={() =>
                              router.push(`/pages/messages?destinataire=${c.idUtilisateurEntreprise}`)
                            }
                          >
                            <MessageSquare size={13} strokeWidth={2} />
                            Contacter
                          </ActionButton>
                        )}
                        <ActionButton
                          onClick={() => router.push(`/pages/entrepriseProfil/${c.idEntreprise}`)}
                        >
                          Voir l&apos;entreprise
                        </ActionButton>
                      </div>
                    </CardFooter>
                  </CandidatureCard>
                ))}
              </CandidatureList>
            )}
          </>
        )}
      </PageContainer>
    </>
  )
}
