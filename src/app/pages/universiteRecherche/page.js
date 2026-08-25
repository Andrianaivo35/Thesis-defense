'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAuth } from '@/lib/auth'
import AppNavbar from '@/components/appNavbar'
import {
  Search, Building2, GraduationCap, Briefcase, BookMarked,
  Target, Building, ArrowRight
} from 'lucide-react'
import {
  PageContainer,
  HeaderSection, PageTitle, PageSubtitle,
  TabsRow, TabButton,
  SearchBarWrapper, SearchBarIcon, SearchBar,
  Grid, Card, CardLogo, CardName, CardSubtext,
  CardBody, CardInfo, CardInfoItem,
  CardFooter, CardBadge, ViewButton,
  EmptyState, LoadingState
} from '@/components/styleUniversiteRecherche'

export default function UniversiteRecherche() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('entreprises')
  const [searchTerm, setSearchTerm] = useState('')
  const [entreprises, setEntreprises] = useState([])
  const [etudiants, setEtudiants] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [resEnt, resEtu] = await Promise.all([
          fetchAuth('/api/rechercheEntreprise'),
          fetchAuth('/api/rechercheCandidat')
        ])
        const dataEnt = await resEnt.json()
        const dataEtu = await resEtu.json()

        if (resEnt.ok) setEntreprises(dataEnt.entreprises || [])
        if (resEtu.ok) setEtudiants(dataEtu.etudiants || [])
      } catch (err) {
        console.error('Erreur:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAll()
  }, [])

  const entreprisesFiltrees = useMemo(() => {
    const s = searchTerm.toLowerCase().trim()
    if (!s) return entreprises
    return entreprises.filter(e =>
      e.nomEntreprise?.toLowerCase().includes(s) ||
      e.secteurActivitePrincipal?.toLowerCase().includes(s) ||
      e.description?.toLowerCase().includes(s) ||
      e.adresseSiegeSocial?.toLowerCase().includes(s)
    )
  }, [entreprises, searchTerm])

  const etudiantsFiltres = useMemo(() => {
    const s = searchTerm.toLowerCase().trim()
    if (!s) return etudiants
    return etudiants.filter(e =>
      e.nomEtudiant?.toLowerCase().includes(s) ||
      e.prenomEtudiant?.toLowerCase().includes(s) ||
      e.filiere?.toLowerCase().includes(s) ||
      e.specialisation?.toLowerCase().includes(s) ||
      e.nomUniversite?.toLowerCase().includes(s) ||
      e.bio?.toLowerCase().includes(s)
    )
  }, [etudiants, searchTerm])

  const handleVoirEntreprise = (idEntreprise) => {
    router.push(`/pages/entrepriseProfil/${idEntreprise}`)
  }

  const handleVoirEtudiant = (idEtudiant) => {
    router.push(`/pages/etudiantProfil/${idEtudiant}`)
  }

  const truncate = (text, max = 100) => {
    if (!text) return ''
    return text.length > max ? text.substring(0, max).trim() + '...' : text
  }

  const placeholders = {
    entreprises: 'Rechercher par nom, secteur, ville...',
    etudiants: 'Rechercher par nom, filière, université...'
  }

  return (
    <>
      <AppNavbar />
      <PageContainer>
        <HeaderSection>
          <PageTitle>
            <Search size={26} strokeWidth={2} />
            Trouver une entreprise ou un étudiant
          </PageTitle>
          <PageSubtitle>
            Explorez les entreprises partenaires et découvrez tous les étudiants
            inscrits sur la plateforme.
          </PageSubtitle>
        </HeaderSection>

        {/* === ONGLETS === */}
        <TabsRow>
          <TabButton
            $active={activeTab === 'entreprises'}
            onClick={() => { setActiveTab('entreprises'); setSearchTerm('') }}
          >
            <Building2 size={16} strokeWidth={2} />
            Entreprises 
          </TabButton>
          <TabButton
            $active={activeTab === 'etudiants'}
            onClick={() => { setActiveTab('etudiants'); setSearchTerm('') }}
          >
            <GraduationCap size={16} strokeWidth={2} />
            Étudiants 
          </TabButton>
        </TabsRow>

        {/* === BARRE DE RECHERCHE === */}
        <SearchBarWrapper>
          <SearchBarIcon>
            <Search size={18} strokeWidth={2} />
          </SearchBarIcon>
          <SearchBar
            type="text"
            placeholder={placeholders[activeTab]}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBarWrapper>

        {/* === CONTENU SELON L'ONGLET === */}
        {isLoading ? (
          <LoadingState>Chargement...</LoadingState>
        ) : activeTab === 'entreprises' ? (
          entreprisesFiltrees.length === 0 ? (
            <EmptyState>
              {searchTerm
                ? 'Aucune entreprise ne correspond à votre recherche.'
                : 'Aucune entreprise disponible pour le moment.'}
            </EmptyState>
          ) : (
            <Grid>
              {entreprisesFiltrees.map((e) => (
                <Card key={e.idEntreprise} onClick={() => handleVoirEntreprise(e.idEntreprise)}>
                  <CardLogo>
                    {e.logo ? (
                      <img src={e.logo} alt={e.nomEntreprise} />
                    ) : (
                      e.nomEntreprise?.charAt(0).toUpperCase()
                    )}
                  </CardLogo>
                  <CardName>{e.nomEntreprise}</CardName>
                  {e.secteurActivitePrincipal && (
                    <CardSubtext>{e.secteurActivitePrincipal}</CardSubtext>
                  )}
                  <CardBody>
                    {e.description && truncate(e.description)}
                  </CardBody>
                  <CardFooter>
                    <CardBadge>
                      <Briefcase size={11} strokeWidth={2.5} />
                      {e.nombreOffresActives || 0} offre{e.nombreOffresActives > 1 ? 's' : ''}
                    </CardBadge>
                    <ViewButton>
                      Voir le profil
                      <ArrowRight size={13} strokeWidth={2.5} />
                    </ViewButton>
                  </CardFooter>
                </Card>
              ))}
            </Grid>
          )
        ) : (
          // === ONGLET ÉTUDIANTS ===
          etudiantsFiltres.length === 0 ? (
            <EmptyState>
              {searchTerm
                ? 'Aucun étudiant ne correspond à votre recherche.'
                : 'Aucun étudiant inscrit pour le moment.'}
            </EmptyState>
          ) : (
            <Grid>
              {etudiantsFiltres.map((e) => (
                <Card key={e.idEtudiant} onClick={() => handleVoirEtudiant(e.idEtudiant)}>
                  <CardLogo>
                    {e.photoProfil ? (
                      <img src={e.photoProfil} alt={e.prenomEtudiant} />
                    ) : (
                      (e.prenomEtudiant?.charAt(0) || '') + (e.nomEtudiant?.charAt(0) || '')
                    )}
                  </CardLogo>
                  <CardName>{e.prenomEtudiant} {e.nomEtudiant}</CardName>
                  {e.niveauAcademique && (
                    <CardSubtext>{e.niveauAcademique}</CardSubtext>
                  )}
                  <CardInfo>
                    {e.filiere && (
                      <CardInfoItem>
                        <BookMarked size={13} strokeWidth={2} />
                        {e.filiere}
                      </CardInfoItem>
                    )}
                    {e.specialisation && (
                      <CardInfoItem>
                        <Target size={13} strokeWidth={2} />
                        {e.specialisation}
                      </CardInfoItem>
                    )}
                    {e.nomUniversite && (
                      <CardInfoItem>
                        <Building size={13} strokeWidth={2} />
                        {e.sigleUniversitaire || e.nomUniversite}
                      </CardInfoItem>
                    )}
                  </CardInfo>
                  <CardBody>
                    {e.bio && truncate(e.bio)}
                  </CardBody>
                  <CardFooter>
                    <CardBadge>
                      <Briefcase size={11} strokeWidth={2.5} />
                      {e.nombreParcours || 0} parcours
                    </CardBadge>
                    <ViewButton>
                      Voir le profil
                      <ArrowRight size={13} strokeWidth={2.5} />
                    </ViewButton>
                  </CardFooter>
                </Card>
              ))}
            </Grid>
          )
        )}
      </PageContainer>
    </>
  )
}