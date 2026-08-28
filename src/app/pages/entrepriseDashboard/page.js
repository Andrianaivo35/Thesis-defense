'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAuth, getUtilisateur } from '@/lib/auth'
import AppNavbar from '@/components/appNavbar'
import {
  LayoutDashboard, Briefcase, Users, Clock, CheckCircle2,
  Plus, Search, ArrowRight, FileText
} from 'lucide-react'
import {
  PageContainer, PageHeader, PageTitle, PageSubtitle,
  StatsRow, StatCard, StatValue, StatLabel,
  CandidatureList, CandidatureCard, CardHeader,
  OffreTitre, EntrepriseNom, StatutBadge,
  CardMeta, MetaItem, CardFooter, ActionButton,
  EmptyState, LoadingState
} from '@/components/styleEtudiantCandidature'

function formaterDate(valeur) {
  if (!valeur) return '—'
  return new Date(valeur).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

/* Le statut d'une candidature est technique ; on l'affiche en clair. */
function libelleStatut(statut) {
  if (statut === 'Recruté') return 'Retenue'
  if (statut === 'Refusé') return 'Non retenue'
  return 'En attente'
}

export default function EntrepriseDashboard() {
  const router = useRouter()
  const [donnees, setDonnees] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [user, setUser] = useState(null)

  useEffect(() => { setUser(getUtilisateur()) }, [])

  useEffect(() => {
    const charger = async () => {
      try {
        const res = await fetchAuth('/api/entrepriseDashboard')
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

  const stats = donnees?.statistiques

  return (
    <>
      <AppNavbar />
      <PageContainer>
        <PageHeader>
          <PageTitle>
            <LayoutDashboard size={24} strokeWidth={2} />
            Tableau de bord
          </PageTitle>
          <PageSubtitle>
            {user?.nomEntreprise
              ? `Bienvenue ${user.nomEntreprise} — suivez vos offres et vos candidatures.`
              : 'Suivez vos offres et vos candidatures.'}
          </PageSubtitle>
        </PageHeader>

        {isLoading ? (
          <LoadingState>Chargement de votre tableau de bord...</LoadingState>
        ) : erreur ? (
          <EmptyState>{erreur}</EmptyState>
        ) : (
          <>
            <StatsRow>
              <StatCard>
                <StatValue>{stats.offresActives}</StatValue>
                <StatLabel>Offres actives</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{stats.candidaturesTotal}</StatValue>
                <StatLabel>Candidatures reçues</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{stats.candidaturesEnAttente}</StatValue>
                <StatLabel>À traiter</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{stats.candidaturesRetenues}</StatValue>
                <StatLabel>Candidats retenus</StatLabel>
              </StatCard>
            </StatsRow>

            {/* === Accès rapides === */}
            <CandidatureCard style={{ marginBottom: 24 }}>
              <CardFooter style={{ borderTop: 'none', paddingTop: 0, justifyContent: 'flex-start', gap: 10 }}>
                <ActionButton onClick={() => router.push('/pages/entrepriseRegistreOffre')}>
                  <Plus size={13} strokeWidth={2} /> Publier une offre
                </ActionButton>
                <ActionButton onClick={() => router.push('/pages/entrepriseCandidature')}>
                  <FileText size={13} strokeWidth={2} /> Voir les candidatures
                </ActionButton>
                <ActionButton onClick={() => router.push('/pages/rechercheCandidat')}>
                  <Search size={13} strokeWidth={2} /> Rechercher un candidat
                </ActionButton>
              </CardFooter>
            </CandidatureCard>

            {/* === Offres récentes === */}
            <PageTitle style={{ fontSize: 19 }}>
              <Briefcase size={19} strokeWidth={2} />
              Vos dernières offres
            </PageTitle>

            {donnees.offresRecentes.length === 0 ? (
              <EmptyState>
                <p>Vous n&apos;avez publié aucune offre pour le moment.</p>
                <p>
                  <ActionButton onClick={() => router.push('/pages/entrepriseRegistreOffre')}>
                    <Plus size={13} strokeWidth={2} /> Publier ma première offre
                  </ActionButton>
                </p>
              </EmptyState>
            ) : (
              <CandidatureList style={{ marginBottom: 28 }}>
                {donnees.offresRecentes.map(o => (
                  <CandidatureCard key={o.idOffre} $statut={o.statut === 'Active' ? 'Recruté' : 'En attente'}>
                    <CardHeader>
                      <div>
                        <OffreTitre>{o.titre}</OffreTitre>
                        <EntrepriseNom>
                          {o.domaine || 'Domaine non précisé'}
                          {o.ville ? ` — ${o.ville}` : ''}
                        </EntrepriseNom>
                      </div>
                      <StatutBadge $statut={o.statut === 'Active' ? 'Recruté' : 'En attente'}>
                        {o.statut === 'Active' ? 'Active' : o.statut}
                      </StatutBadge>
                    </CardHeader>
                    <CardMeta>
                      <MetaItem>
                        <Users size={13} strokeWidth={2} />
                        {o.nombreCandidatures} candidature{o.nombreCandidatures > 1 ? 's' : ''}
                      </MetaItem>
                      <MetaItem>
                        <Clock size={13} strokeWidth={2} />
                        Publiée le {formaterDate(o.datePublication)}
                      </MetaItem>
                    </CardMeta>
                    <CardFooter>
                      <span />
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <ActionButton
                          onClick={() => router.push(`/pages/offreCandidats/${o.idOffre}`)}
                        >
                          <Search size={13} strokeWidth={2} />
                          Candidats suggérés
                        </ActionButton>
                        <ActionButton
                          onClick={() => router.push(`/pages/entrepriseModifierOffre/${o.idOffre}`)}
                        >
                          Gérer cette offre
                          <ArrowRight size={13} strokeWidth={2.5} />
                        </ActionButton>
                      </div>
                    </CardFooter>
                  </CandidatureCard>
                ))}
              </CandidatureList>
            )}

            {/* === Candidatures récentes === */}
            <PageTitle style={{ fontSize: 19 }}>
              <Users size={19} strokeWidth={2} />
              Dernières candidatures reçues
            </PageTitle>

            {donnees.candidaturesRecentes.length === 0 ? (
              <EmptyState>Aucune candidature reçue pour le moment.</EmptyState>
            ) : (
              <CandidatureList>
                {donnees.candidaturesRecentes.map(c => (
                  <CandidatureCard key={c.idCandidature} $statut={c.statut}>
                    <CardHeader>
                      <div>
                        <OffreTitre>{c.prenomEtudiant} {c.nomEtudiant}</OffreTitre>
                        <EntrepriseNom>{c.titreOffre}</EntrepriseNom>
                      </div>
                      <StatutBadge $statut={c.statut}>
                        {c.statut === 'Recruté'
                          ? <CheckCircle2 size={13} strokeWidth={2.5} />
                          : <Clock size={13} strokeWidth={2.5} />}
                        {libelleStatut(c.statut)}
                      </StatutBadge>
                    </CardHeader>
                    <CardMeta>
                      <MetaItem>Reçue le {formaterDate(c.dateCandidature)}</MetaItem>
                      {c.noteQCM !== null && c.noteQCM !== undefined && (
                        <MetaItem>QCM : {Number(c.noteQCM).toFixed(0)} / 100</MetaItem>
                      )}
                    </CardMeta>
                    <CardFooter>
                      <span />
                      <ActionButton onClick={() => router.push('/pages/entrepriseCandidature')}>
                        Traiter
                        <ArrowRight size={13} strokeWidth={2.5} />
                      </ActionButton>
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
