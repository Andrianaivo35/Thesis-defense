'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppNavbar from '@/components/appNavbar'
import { getUtilisateur } from '@/lib/auth'
import { LayoutDashboard, Megaphone, BarChart3, ArrowRight } from 'lucide-react'
import {
  PageContainer, HeaderSection, PageTitle, PageSubtitle,
  QuickAccessGrid, QuickCard, QuickCardIcon, QuickCardTitle, QuickCardText, QuickCardArrow,
  PlaceholderCard, PlaceholderIcon, PlaceholderTitle, PlaceholderText
} from '@/components/styleUniversiteDashboard'

export default function UniversiteDashboard() {
  const router = useRouter()

  // getUtilisateur() lit localStorage : indisponible cote serveur.
  // On ne l'appelle qu'apres le montage pour que le premier rendu client
  // soit identique au rendu serveur -> pas d'erreur d'hydratation.
  const [user, setUser] = useState(null)

  useEffect(() => {
    setUser(getUtilisateur())
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
        </QuickAccessGrid>

        <PlaceholderCard>
          <PlaceholderIcon>
            <BarChart3 size={40} strokeWidth={1.8} />
          </PlaceholderIcon>
          <PlaceholderTitle>Statistiques détaillées à venir</PlaceholderTitle>
          <PlaceholderText>
            Vos graphiques d'évolution, taux de placement et indicateurs clés
            seront bientôt disponibles ici.
          </PlaceholderText>
        </PlaceholderCard>
      </PageContainer>
    </>
  )
}