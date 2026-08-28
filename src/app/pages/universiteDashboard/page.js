'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppNavbar from '@/components/appNavbar'
import { getUtilisateur, fetchAuth } from '@/lib/auth'
import { LayoutDashboard, Megaphone, Users, UserPlus, ArrowRight } from 'lucide-react'
import {
  PageContainer, HeaderSection, PageTitle, PageSubtitle,
  QuickAccessGrid, QuickCard, QuickCardIcon, QuickCardTitle, QuickCardText, QuickCardArrow,
  PlaceholderCard, PlaceholderIcon, PlaceholderTitle, PlaceholderText
} from '@/components/styleUniversiteDashboard'
import {
  StatsRow, StatCard, StatValue, StatLabel, LoadingState
} from '@/components/styleEtudiantCandidature'

export default function UniversiteDashboard() {
  const router = useRouter()

  // getUtilisateur() lit localStorage : indisponible cote serveur.
  // On ne l'appelle qu'apres le montage pour que le premier rendu client
  // soit identique au rendu serveur -> pas d'erreur d'hydratation.
  const [user, setUser] = useState(null)

  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setUser(getUtilisateur())
  }, [])

  useEffect(() => {
    const charger = async () => {
      try {
        const res = await fetchAuth('/api/universiteDashboard')
        const data = await res.json()
        if (res.ok) setStats(data.statistiques)
      } catch (err) {
        console.error('Statistiques non chargées :', err)
      } finally {
        setIsLoading(false)
      }
    }
    charger()
  }, [])

  return (
    <>
      <AppNavbar />
      <PageContainer>
        <HeaderSection>
          <PageTitle>
            <LayoutDashboard size={26} strokeWidth={2} />
            Tableau de bord
          </PageTitle>
          <PageSubtitle>
            Bienvenue {user?.nomUniversite || ''} — Pilotez le placement de vos étudiants en un coup d'œil.
          </PageSubtitle>
        </HeaderSection>

        {/* === Accès rapides === */}
        <QuickAccessGrid>
          <QuickCard onClick={() => router.push('/pages/universiteCohortes')}>
            <QuickCardIcon>
              <Megaphone size={28} strokeWidth={2} />
            </QuickCardIcon>
            <QuickCardTitle>Mes annonces de cohorte</QuickCardTitle>
            <QuickCardText>
              Publiez des groupes d'étudiants en recherche de stage,
              visibles par les entreprises de la plateforme.
            </QuickCardText>
            <QuickCardArrow>
              Gérer mes annonces
              <ArrowRight size={14} strokeWidth={2.5} />
            </QuickCardArrow>
          </QuickCard>
          <QuickCard onClick={() => router.push('/pages/universiteEtudiant')}>
            <QuickCardIcon>
              <Users size={28} strokeWidth={2} />
            </QuickCardIcon>
            <QuickCardTitle>Mes étudiants</QuickCardTitle>
            <QuickCardText>
              Consultez vos étudiants rattachés et traitez les demandes
              de rattachement en attente.
            </QuickCardText>
            <QuickCardArrow>
              Voir mes étudiants
              <ArrowRight size={14} strokeWidth={2.5} />
            </QuickCardArrow>
          </QuickCard>

          <QuickCard onClick={() => router.push('/pages/universiteAjoutEtudiant')}>
            <QuickCardIcon>
              <UserPlus size={28} strokeWidth={2} />
            </QuickCardIcon>
            <QuickCardTitle>Ajouter un étudiant</QuickCardTitle>
            <QuickCardText>
              Créez le compte d&apos;un étudiant de votre établissement,
              directement rattaché à votre université.
            </QuickCardText>
            <QuickCardArrow>
              Créer un compte
              <ArrowRight size={14} strokeWidth={2.5} />
            </QuickCardArrow>
          </QuickCard>
        </QuickAccessGrid>

        {isLoading ? (
          <LoadingState>Chargement des statistiques...</LoadingState>
        ) : stats ? (
          <StatsRow style={{ marginTop: 24 }}>
            <StatCard>
              <StatValue>{stats.etudiantsValides}</StatValue>
              <StatLabel>Étudiants rattachés</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{stats.demandesEnAttente}</StatValue>
              <StatLabel>Demandes en attente</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{stats.candidaturesTotal}</StatValue>
              <StatLabel>Candidatures envoyées</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{stats.placements}</StatValue>
              <StatLabel>Stages obtenus</StatLabel>
            </StatCard>
          </StatsRow>
        ) : (
          <PlaceholderCard>
            <PlaceholderIcon><Users size={40} strokeWidth={1.8} /></PlaceholderIcon>
            <PlaceholderTitle>Statistiques indisponibles</PlaceholderTitle>
            <PlaceholderText>
              Les indicateurs n&apos;ont pas pu être chargés. Rechargez la page.
            </PlaceholderText>
          </PlaceholderCard>
        )}
      </PageContainer>
    </>
  )
}