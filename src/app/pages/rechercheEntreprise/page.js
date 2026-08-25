'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppNavbar from '@/components/appNavbar'
import { Search, BadgeCheck, Briefcase, ArrowRight } from 'lucide-react'
import {
  PageContainer,
  HeroSection, HeroTitle, HeroDescription,
  HeaderSection, SearchBarWrapper, SearchIcon, SearchBar, PageTitle,
  EntreprisesGrid, EntrepriseCard, EntrepriseLogo,
  EntrepriseHeader, EntrepriseName, VerifiedBadge,
  EntrepriseSector, EntrepriseDescription,
  EntrepriseFooter, OffresCount, ViewProfileButton,
  EmptyState, LoadingState
} from '@/components/styleRechercheEntreprise'

export default function RechercheEntreprise() {
  const router = useRouter()
  const [entreprises, setEntreprises] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchEntreprises = async () => {
      try {
        const res = await fetch('/api/rechercheEntreprise')
        const data = await res.json()
        if (!res.ok) throw new Error(data.details || data.error)
        setEntreprises(data.entreprises)
      } catch (err) {
        console.error('Erreur:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchEntreprises()
  }, [])

  const entreprisesFiltrees = entreprises.filter(e => {
    const search = searchTerm.toLowerCase().trim()
    if (!search) return true
    return (
      e.nomEntreprise?.toLowerCase().includes(search) ||
      e.secteurActivitePrincipal?.toLowerCase().includes(search) ||
      e.description?.toLowerCase().includes(search) ||
      e.adresseSiegeSocial?.toLowerCase().includes(search)
    )
  })

  const handleVoirProfil = (idEntreprise) => {
    router.push(`/pages/entrepriseProfil/${idEntreprise}`)
  }

  const truncate = (text, max = 120) => {
    if (!text) return ''
    return text.length > max ? text.substring(0, max).trim() + '...' : text
  }

  return (
    <>
      <AppNavbar />
      <PageContainer>

        {/* === SECTION HERO === */}
        <HeroSection>
          <HeroTitle>Trouver une entreprise qui recrute</HeroTitle>
          <HeroDescription>
            Plongez dans un univers d'opportunités en explorant les entreprises
            qui recrutent actuellement. Découvrez des postes passionnants et trouvez
            le défi professionnel parfait pour vous. Rejoignez-nous dès aujourd'hui
            pour commencer votre parcours vers une carrière épanouissante.
          </HeroDescription>

          <HeaderSection>
            <SearchBarWrapper>
              <SearchIcon>
                <Search size={18} strokeWidth={2} />
              </SearchIcon>
              <SearchBar
                type="text"
                placeholder="Rechercher une entreprise par nom, secteur, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchBarWrapper>
          </HeaderSection>
        </HeroSection>

        {/* === LISTE DES ENTREPRISES === */}
        <PageTitle>Découvrir les entreprises</PageTitle>

        {isLoading ? (
          <LoadingState>Chargement des entreprises...</LoadingState>
        ) : entreprisesFiltrees.length === 0 ? (
          <EmptyState>
            {searchTerm
              ? 'Aucune entreprise ne correspond à votre recherche.'
              : 'Aucune entreprise disponible pour le moment.'}
          </EmptyState> 
        ) : (
          <EntreprisesGrid>
            {entreprisesFiltrees.map((e) => (
              <EntrepriseCard
                key={e.idEntreprise}
                onClick={() => handleVoirProfil(e.idEntreprise)}
              >
                <EntrepriseLogo>
                  {e.logo ? (
                    <img src={e.logo} alt={e.nomEntreprise} />
                  ) : (
                    e.nomEntreprise?.charAt(0).toUpperCase()
                  )}
                </EntrepriseLogo>

                <EntrepriseHeader>
                  <EntrepriseName>
                    {e.nomEntreprise}
                    {e.estVerifie && (
                      <VerifiedBadge title="Entreprise vérifiée">
                        <BadgeCheck size={18} strokeWidth={2.5} />
                      </VerifiedBadge>
                    )}
                  </EntrepriseName>
                  {e.secteurActivitePrincipal && (
                    <EntrepriseSector>{e.secteurActivitePrincipal}</EntrepriseSector>
                  )}
                </EntrepriseHeader>

                {e.description && (
                  <EntrepriseDescription>
                    {truncate(e.description)}
                  </EntrepriseDescription>
                )}

                <EntrepriseFooter>
                  <OffresCount>
                    <Briefcase size={13} strokeWidth={2} />
                    {e.nombreOffresActives || 0} offre{e.nombreOffresActives > 1 ? 's' : ''} active{e.nombreOffresActives > 1 ? 's' : ''}
                  </OffresCount>
                  <ViewProfileButton>
                    Voir le profil
                    <ArrowRight size={14} strokeWidth={2.5} />
                  </ViewProfileButton>
                </EntrepriseFooter>
              </EntrepriseCard>
            ))}
          </EntreprisesGrid>
        )}
      </PageContainer>
    </>
  )
}