'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import OffreModal from '@/components/offreModal'
import AppNavbar from '@/components/appNavbar'
import Recommandations from '@/components/recommandations'
import { getUtilisateur, fetchAuth } from '@/lib/auth'
import { Search, MapPin, Clock, CalendarDays, ArrowRight, Plus } from 'lucide-react'
import {
  PageContainer,
  HeaderSection,
  HeaderTop,
  WelcomeText,
  PublishButton,
  SearchBarWrapper,
  SearchIcon,
  SearchBar,
  PageTitle,
  OffersList,
  OfferCard,
  CompanySection,
  CompanyLogo,
  CompanyName,
  OfferDetails,
  OfferTitle,
  OfferMeta,
  MetaItem,
  ViewButton,
  OwnOfferBadge,
  EmptyState,
  LoadingState
} from '@/components/styleListeOffre'

export default function ListeOffre() {
  const router = useRouter()
  const [offres, setOffres] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOffre, setSelectedOffre] = useState(null)

  // lu apres le montage : localStorage n'existe pas cote serveur
  const [user, setUser] = useState(null)
  useEffect(() => {
    setUser(getUtilisateur())
  }, [])

  const estEtudiant = user?.typeUtilisateur === 'Etudiant'
  const idEtudiant = user?.idEtudiant

  const estEntreprise = user?.typeUtilisateur === 'Entreprise'
  const idEntreprise = user?.idEntreprise

  useEffect(() => {
    const fetchOffres = async () => {
      try {
        // fetchAuth transmet le jeton s'il existe : la route reste accessible
        // sans authentification, mais renvoie alors dejaPostule = false.
        const res = await fetchAuth('/api/listeOffre')
        const data = await res.json()
        if (!res.ok) throw new Error(data.details || data.error)
        setOffres(data.offres)
      } catch (err) {
        console.error('Erreur:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchOffres()
  }, [])

  const offresFiltrees = offres.filter(offre => {
    const search = searchTerm.toLowerCase().trim()
    if (!search) return true
    return (
      offre.titre?.toLowerCase().includes(search) ||
      offre.description?.toLowerCase().includes(search) ||
      offre.nomEntreprise?.toLowerCase().includes(search) ||
      offre.ville?.toLowerCase().includes(search) ||
      offre.domaine?.toLowerCase().includes(search)
    )
  })

  const formatDate = (date) => {
    if (!date) return 'Non spécifiée'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
    })
  }

  const handlePostuler = (offre) => {
    setSelectedOffre(null)
    router.push(`/pages/qcm/${offre.idOffre}`)
  }

  const handleVoirProfil = (idEntrepriseOffre) => {
    router.push(`/pages/entrepriseProfil/${idEntrepriseOffre}`)
  }

  // === ENTREPRISE : publier une nouvelle offre ===
  const handlePublier = () => {
    router.push('/pages/entrepriseRegistreOffre')
  }

  // compare en chaine : l'id peut arriver en nombre depuis l'API et en texte depuis localStorage
  const estMonOffre = (offre) =>
    estEntreprise &&
    idEntreprise != null &&
    String(offre.idEntreprise) === String(idEntreprise)

  return (
    <>
      <AppNavbar />
      <PageContainer>
        <HeaderSection>
          <HeaderTop>
            <WelcomeText>
              {estEntreprise
                ? `Bonjour ${user?.nomEntreprise || ''}`
                : estEtudiant
                  ? 'Trouvez le stage qui vous correspond'
                  : ''}
            </WelcomeText>

            {/* === Bouton reserve aux comptes Entreprise === */}
            {estEntreprise && (
              <PublishButton onClick={handlePublier}>
                <Plus size={18} strokeWidth={2.5} />
                Publier une nouvelle offre
              </PublishButton>
            )}
          </HeaderTop>

          <SearchBarWrapper>
            <SearchIcon>
              <Search size={18} strokeWidth={2} />
            </SearchIcon>
            <SearchBar
              type="text"
              placeholder="Rechercher une offre, une entreprise, une ville..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchBarWrapper>
        </HeaderSection>

        {/* === RECOMMANDATIONS : etudiants uniquement, et pas pendant une recherche === */}
        {estEtudiant && !searchTerm && (
          <Recommandations
            onVoirDetails={(offre) => setSelectedOffre(offre)}
            onCompleterProfil={() =>
              idEtudiant && router.push(`/pages/etudiantProfil/${idEtudiant}`)
            }
          />
        )}

        <PageTitle>Toutes les offres</PageTitle>

        {isLoading ? (
          <LoadingState>Chargement des offres...</LoadingState>
        ) : offresFiltrees.length === 0 ? (
          <EmptyState>
            {searchTerm
              ? 'Aucune offre ne correspond à votre recherche.'
              : 'Aucune offre disponible pour le moment.'}
          </EmptyState>
        ) : (
          <OffersList>
            {offresFiltrees.map((offre) => (
              <OfferCard key={offre.idOffre}>
                <CompanySection
                  onClick={() => handleVoirProfil(offre.idEntreprise)}
                  style={{ cursor: 'pointer' }}
                >
                  <CompanyLogo>
                    {offre.logoEntreprise ? (
                      <img src={offre.logoEntreprise} alt={offre.nomEntreprise} />
                    ) : (
                      offre.nomEntreprise?.charAt(0).toUpperCase()
                    )}
                  </CompanyLogo>
                  <CompanyName>{offre.nomEntreprise}</CompanyName>
                </CompanySection>

                <OfferDetails>
                  {estMonOffre(offre) && <OwnOfferBadge>Votre offre</OwnOfferBadge>}
                  {offre.dejaPostule && (
                    <OwnOfferBadge>
                      {offre.statutCandidature === 'Recruté'
                        ? 'Candidature retenue'
                        : offre.statutCandidature === 'Refusé'
                          ? 'Candidature non retenue'
                          : 'Déjà postulé'}
                    </OwnOfferBadge>
                  )}
                  <OfferTitle>{offre.titre}</OfferTitle>
                  <OfferMeta>
                    <MetaItem>
                      <MapPin size={14} strokeWidth={2} />
                      {offre.ville || 'Non spécifiée'}
                    </MetaItem>
                    <MetaItem>
                      <Clock size={14} strokeWidth={2} />
                      Limite : {formatDate(offre.dateLimites)}
                    </MetaItem>
                    <MetaItem>
                      <CalendarDays size={14} strokeWidth={2} />
                      Publiée : {formatDate(offre.datePublication)}
                    </MetaItem>
                  </OfferMeta>
                  <ViewButton onClick={() => setSelectedOffre(offre)}>
                    Voir les détails
                    <ArrowRight size={15} strokeWidth={2.5} />
                  </ViewButton>
                </OfferDetails>
              </OfferCard>
            ))}
          </OffersList>
        )}

        {selectedOffre && (
          <OffreModal
            offre={selectedOffre}
            onClose={() => setSelectedOffre(null)}
            onPostuler={estEtudiant ? handlePostuler : null}
          />
        )}
      </PageContainer>
    </>
  )
}