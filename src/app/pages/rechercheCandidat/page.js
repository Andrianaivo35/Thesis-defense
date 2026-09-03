'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAuth } from '@/lib/auth'
import AppNavbar from '@/components/appNavbar'
import {
  Search, GraduationCap, School, BookMarked, Target, Building,
  ArrowRight, BadgeCheck, Clock, MapPin,
  CalendarClock, Users, Eye, Megaphone, X, Building2,
  MessageCircle, FileText, ClipboardList, Mail, Download
} from 'lucide-react'
import {
  PageContainer, HeroSection, HeroTitle, HeroDescription, HeaderSection,
  SearchBarWrapper, SearchBarIcon, SearchBar,
  PageTitle,
  CandidatsGrid, CandidatCard, CandidatTop, CandidatAvatar,
  CandidatHeader, CandidatName, CandidatLevel,
  CandidatInfo, CandidatInfoItem,
  CandidatBio,
  CandidatFooter, ViewProfileButton,
  EmptyState, LoadingState,
  TabsRow, TabButton,
  CohortesGrid, CohorteCard,
  CohorteUniversiteHeader, CohorteUniversiteLogo,
  CohorteUniversiteInfo, CohorteUniversiteFullName, CohorteUniversiteSigle,
  VerifiedBadge,
  CohorteTitle, CohorteMeta, CohorteMetaItem,
  CohorteFooter, CohorteEtudiantsBadge, CohorteVoirButton,
  DetailOverlay, DetailModal, DetailHeader, DetailTitle, DetailClose, DetailBody,
  UniversiteCard, UniversiteCardLogo, UniversiteCardInfo, UniversiteCardName, UniversiteCardLocation,
  ContactUniversiteButton,
  DetailSection, DetailSectionTitle,
  DetailGrid, DetailField, DetailLabel, DetailValue,
  DetailDescription,
  EtudiantsListModal, EtudiantRow, EtudiantInfoModal, EtudiantNomComplet, EtudiantEmail,
  EtudiantCvAction, EtudiantSansCv
} from '@/components/styleRechercheCandidat'

export default function RechercheCandidat() {
  const router = useRouter()

  const [activeTab, setActiveTab] = useState('etudiants')
  const [etudiants, setEtudiants] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterNiveau, setFilterNiveau] = useState('all')
  const [cohortes, setCohortes] = useState([])
  const [detailCohorte, setDetailCohorte] = useState(null)
  const [detailEtudiants, setDetailEtudiants] = useState([])
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [resEtu, resCoh] = await Promise.all([
          fetchAuth('/api/rechercheCandidat'),
          fetchAuth('/api/cohortes')
        ])
        const dataEtu = await resEtu.json()
        const dataCoh = await resCoh.json()
        if (resEtu.ok) setEtudiants(dataEtu.etudiants || [])
        if (resCoh.ok) setCohortes(dataCoh.cohortes || [])
      } catch (err) {
        console.error('Erreur:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAll()
  }, [])

  const etudiantsFiltres = useMemo(() => {
    let filtered = etudiants
    if (filterNiveau !== 'all') {
      filtered = filtered.filter(e => e.niveauAcademique === filterNiveau)
    }
    const search = searchTerm.toLowerCase().trim()
    if (search) {
      filtered = filtered.filter(e =>
        e.nomEtudiant?.toLowerCase().includes(search) ||
        e.prenomEtudiant?.toLowerCase().includes(search) ||
        e.filiere?.toLowerCase().includes(search) ||
        e.specialisation?.toLowerCase().includes(search) ||
        e.nomUniversite?.toLowerCase().includes(search) ||
        e.bio?.toLowerCase().includes(search)
      )
    }
    return filtered
  }, [etudiants, searchTerm, filterNiveau])

  const cohortesFiltrees = useMemo(() => {
    const s = searchTerm.toLowerCase().trim()
    if (!s) return cohortes
    return cohortes.filter(c =>
      c.titre?.toLowerCase().includes(s) ||
      c.filiereConcernee?.toLowerCase().includes(s) ||
      c.niveauAcademique?.toLowerCase().includes(s) ||
      c.domainesRecherche?.toLowerCase().includes(s) ||
      c.nomUniversite?.toLowerCase().includes(s) ||
      c.sigleUniversitaire?.toLowerCase().includes(s)
    )
  }, [cohortes, searchTerm])

  const handleVoirProfil = (idEtudiant) => {
    router.push(`/pages/etudiantProfil/${idEtudiant}`)
  }

  const ouvrirDetailCohorte = async (cohorte) => {
    setDetailCohorte(cohorte)
    setDetailEtudiants([])
    setIsLoadingDetail(true)
    try {
      const res = await fetchAuth(`/api/cohortes/${cohorte.idAnnonceCohorte}`)
      const data = await res.json()
      if (res.ok) {
        setDetailCohorte(data.annonce)
        setDetailEtudiants(data.etudiants || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingDetail(false)
    }
  }

  const fermerDetail = () => {
    setDetailCohorte(null)
    setDetailEtudiants([])
  }

  const contacterUniversite = () => {
    if (!detailCohorte?.idUtilisateurUniversite) return
    router.push(`/pages/messages?destinataire=${detailCohorte.idUtilisateurUniversite}`)
  }


  const truncate = (text, max = 100) => {
    if (!text) return ''
    return text.length > max ? text.substring(0, max).trim() + '...' : text
  }

  const formatDate = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
    })
  }

  const placeholders = {
    etudiants: 'Rechercher par nom, filière, spécialisation, université...',
    cohortes: 'Rechercher par titre, niveau, université...'
  }

  return (
    <>
      <AppNavbar />
      <PageContainer>
        <HeroSection>
          <HeroTitle>Trouver le candidat qui vous correspond</HeroTitle>
          <HeroDescription>
            Parcourez les profils étudiants disponibles ou consultez les cohortes
            proposées par les universités partenaires.
          </HeroDescription>
        </HeroSection>

        <HeaderSection>
          {/* === Onglets === */}
          <TabsRow>
            <TabButton
              $active={activeTab === 'etudiants'}
              onClick={() => { setActiveTab('etudiants'); setSearchTerm('') }}
            >
              <GraduationCap size={16} strokeWidth={2} />
              Étudiants
            </TabButton>
            <TabButton
              $active={activeTab === 'cohortes'}
              onClick={() => { setActiveTab('cohortes'); setSearchTerm('') }}
            >
              <School size={16} strokeWidth={2} />
              Cohortes universitaires
            </TabButton>
          </TabsRow>

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
        </HeaderSection>

        <PageTitle>
          {activeTab === 'etudiants'
            ? `Découvrir les candidats`
            : `Cohortes universitaires`}
        </PageTitle>

        {isLoading ? (
          <LoadingState>Chargement...</LoadingState>
        ) : activeTab === 'etudiants' ? (
          /* ============= ONGLET ÉTUDIANTS ============= */
          etudiantsFiltres.length === 0 ? (
            <EmptyState>
              {searchTerm || filterNiveau !== 'all'
                ? 'Aucun candidat ne correspond à vos critères.'
                : 'Aucun candidat disponible pour le moment.'}
            </EmptyState>
          ) : (
            <CandidatsGrid>
              {etudiantsFiltres.map((e) => (
                <CandidatCard
                  key={e.idEtudiant}
                  onClick={() => handleVoirProfil(e.idEtudiant)}
                >
                  {/* avatar et nom sur la meme ligne */}
                  <CandidatTop>
                    <CandidatAvatar>
                      {e.photoProfil ? (
                        <img src={e.photoProfil} alt={e.prenomEtudiant} />
                      ) : (
                        (e.prenomEtudiant?.charAt(0) || '') + (e.nomEtudiant?.charAt(0) || '')
                      )}
                    </CandidatAvatar>

                    <CandidatHeader>
                      <CandidatName>{e.prenomEtudiant} {e.nomEtudiant}</CandidatName>
                      {e.niveauAcademique && <CandidatLevel>{e.niveauAcademique}</CandidatLevel>}
                    </CandidatHeader>
                  </CandidatTop>

                  <CandidatInfo>
                    {e.filiere && (
                      <CandidatInfoItem>
                        <BookMarked size={13} strokeWidth={2} />
                        {e.filiere}
                      </CandidatInfoItem>
                    )}
                    {e.specialisation && (
                      <CandidatInfoItem>
                        <Target size={13} strokeWidth={2} />
                        {e.specialisation}
                      </CandidatInfoItem>
                    )}
                    {e.nomUniversite && (
                      <CandidatInfoItem>
                        <Building size={13} strokeWidth={2} />
                        {e.sigleUniversitaire || e.nomUniversite}
                      </CandidatInfoItem>
                    )}
                  </CandidatInfo>

                  {e.bio && <CandidatBio>{truncate(e.bio)}</CandidatBio>}

                  <CandidatFooter>
                    <ViewProfileButton>
                      Voir le profil
                      <ArrowRight size={13} strokeWidth={2.5} />
                    </ViewProfileButton>
                  </CandidatFooter>
                </CandidatCard>
              ))}
            </CandidatsGrid>
          )
        ) : (
          /* ============= ONGLET COHORTES ============= */
          cohortesFiltrees.length === 0 ? (
            <EmptyState>
              {searchTerm
                ? 'Aucune cohorte ne correspond à votre recherche.'
                : 'Aucune cohorte universitaire publiée pour le moment.'}
            </EmptyState>
          ) : (
            <CohortesGrid>
              {cohortesFiltrees.map(c => (
                <CohorteCard key={c.idAnnonceCohorte}>
                  {/* logo + nom complet de l'universite, au-dessus du titre */}
                  <CohorteUniversiteHeader>
                    <CohorteUniversiteLogo>
                      {c.logoUniversite ? (
                        <img src={c.logoUniversite} alt={c.nomUniversite} />
                      ) : (
                        c.sigleUniversitaire?.charAt(0).toUpperCase() ||
                        c.nomUniversite?.charAt(0).toUpperCase()
                      )}
                    </CohorteUniversiteLogo>

                    <CohorteUniversiteInfo>
                      <CohorteUniversiteFullName>
                        {c.nomUniversite}
                        {c.estVerifie && (
                          <VerifiedBadge>
                            <BadgeCheck size={12} strokeWidth={2.5} />
                            Vérifiée
                          </VerifiedBadge>
                        )}
                      </CohorteUniversiteFullName>
                      {c.sigleUniversitaire && (
                        <CohorteUniversiteSigle>
                          <Building2 size={11} strokeWidth={2} />
                          {c.sigleUniversitaire}
                        </CohorteUniversiteSigle>
                      )}
                    </CohorteUniversiteInfo>
                  </CohorteUniversiteHeader>

                  <CohorteTitle>{c.titre}</CohorteTitle>

                  <CohorteMeta>
                    {c.niveauAcademique && (
                      <CohorteMetaItem>
                        <GraduationCap size={13} strokeWidth={2} />
                        {c.niveauAcademique}
                      </CohorteMetaItem>
                    )}
                    {c.filiereConcernee && (
                      <CohorteMetaItem>
                        <BookMarked size={13} strokeWidth={2} />
                        {c.filiereConcernee}
                      </CohorteMetaItem>
                    )}
                    {c.dureeStage && (
                      <CohorteMetaItem>
                        <Clock size={13} strokeWidth={2} />
                        {c.dureeStage}
                      </CohorteMetaItem>
                    )}
                    {c.villePreferee && (
                      <CohorteMetaItem>
                        <MapPin size={13} strokeWidth={2} />
                        {c.villePreferee}
                      </CohorteMetaItem>
                    )}
                    {c.dateLimite && (
                      <CohorteMetaItem>
                        <CalendarClock size={13} strokeWidth={2} />
                        Limite : {formatDate(c.dateLimite)}
                      </CohorteMetaItem>
                    )}
                  </CohorteMeta>

                  <CohorteFooter>
                    <CohorteEtudiantsBadge>
                      <Users size={12} strokeWidth={2.5} />
                      {c.nombreEtudiants || 0} étudiant{c.nombreEtudiants > 1 ? 's' : ''}
                    </CohorteEtudiantsBadge>
                    <CohorteVoirButton onClick={() => ouvrirDetailCohorte(c)}>
                      <Eye size={13} strokeWidth={2} />
                      Voir les CV
                    </CohorteVoirButton>
                  </CohorteFooter>
                </CohorteCard>
              ))}
            </CohortesGrid>
          )
        )}

        {/* ============= MODAL DÉTAIL COHORTE ============= */}
        {detailCohorte && (
          <DetailOverlay onClick={fermerDetail}>
            <DetailModal onClick={(e) => e.stopPropagation()}>
              <DetailHeader>
                <DetailTitle>
                  <Megaphone size={18} strokeWidth={2} />
                  {detailCohorte.titre}
                </DetailTitle>
                <DetailClose onClick={fermerDetail} aria-label="Fermer">
                  <X size={16} strokeWidth={2.5} />
                </DetailClose>
              </DetailHeader>

              <DetailBody>
                <UniversiteCard>
                  <UniversiteCardLogo>
                    {detailCohorte.logoUniversite ? (
                      <img src={detailCohorte.logoUniversite} alt={detailCohorte.nomUniversite} />
                    ) : (
                      detailCohorte.sigleUniversitaire?.charAt(0).toUpperCase() ||
                      detailCohorte.nomUniversite?.charAt(0).toUpperCase()
                    )}
                  </UniversiteCardLogo>
                  <UniversiteCardInfo>
                    <UniversiteCardName>
                      <Building2 size={14} strokeWidth={2} />
                      {detailCohorte.nomUniversite}
                      {detailCohorte.estVerifie && (
                        <VerifiedBadge>
                          <BadgeCheck size={12} strokeWidth={2.5} />
                          Vérifiée
                        </VerifiedBadge>
                      )}
                    </UniversiteCardName>
                    {detailCohorte.villeUniversite && (
                      <UniversiteCardLocation>
                        <MapPin size={12} strokeWidth={2} />
                        {detailCohorte.villeUniversite}
                      </UniversiteCardLocation>
                    )}
                  </UniversiteCardInfo>
                  <ContactUniversiteButton onClick={contacterUniversite}>
                    <MessageCircle size={13} strokeWidth={2} />
                    Contacter
                  </ContactUniversiteButton>
                </UniversiteCard>

                {detailCohorte.description && (
                  <DetailSection>
                    <DetailSectionTitle>
                      <FileText size={14} strokeWidth={2} />
                      Description
                    </DetailSectionTitle>
                    <DetailDescription>{detailCohorte.description}</DetailDescription>
                  </DetailSection>
                )}

                <DetailSection>
                  <DetailSectionTitle>
                    <Target size={14} strokeWidth={2} />
                    Profil recherché
                  </DetailSectionTitle>
                  <DetailGrid>
                    <DetailField>
                      <DetailLabel>Filière</DetailLabel>
                      <DetailValue>{detailCohorte.filiereConcernee || '—'}</DetailValue>
                    </DetailField>
                    <DetailField>
                      <DetailLabel>Niveau académique</DetailLabel>
                      <DetailValue>{detailCohorte.niveauAcademique || '—'}</DetailValue>
                    </DetailField>
                    <DetailField>
                      <DetailLabel>Domaines de recherche</DetailLabel>
                      <DetailValue>{detailCohorte.domainesRecherche || '—'}</DetailValue>
                    </DetailField>
                  </DetailGrid>
                </DetailSection>

                <DetailSection>
                  <DetailSectionTitle>
                    <ClipboardList size={14} strokeWidth={2} />
                    Conditions du stage
                  </DetailSectionTitle>
                  <DetailGrid>
                    <DetailField>
                      <DetailLabel>Période</DetailLabel>
                      <DetailValue>
                        {detailCohorte.periodeDebut && detailCohorte.periodeFin
                          ? `Du ${formatDate(detailCohorte.periodeDebut)} au ${formatDate(detailCohorte.periodeFin)}`
                          : '—'}
                      </DetailValue>
                    </DetailField>
                    <DetailField>
                      <DetailLabel>Durée</DetailLabel>
                      <DetailValue>{detailCohorte.dureeStage || '—'}</DetailValue>
                    </DetailField>
                    <DetailField>
                      <DetailLabel>Ville préférée</DetailLabel>
                      <DetailValue>{detailCohorte.villePreferee || '—'}</DetailValue>
                    </DetailField>
                    <DetailField>
                      <DetailLabel>Télétravail</DetailLabel>
                      <DetailValue>{detailCohorte.accepteTeletravail || 'Indifférent'}</DetailValue>
                    </DetailField>
                    <DetailField>
                      <DetailLabel>Date limite</DetailLabel>
                      <DetailValue>{formatDate(detailCohorte.dateLimite)}</DetailValue>
                    </DetailField>
                    <DetailField>
                      <DetailLabel>Publiée le</DetailLabel>
                      <DetailValue>{formatDate(detailCohorte.datePublication)}</DetailValue>
                    </DetailField>
                  </DetailGrid>
                </DetailSection>

                <DetailSection>
                  <DetailSectionTitle>
                    <Users size={14} strokeWidth={2} />
                    Étudiants concernés ({detailEtudiants.length})
                  </DetailSectionTitle>

                  {isLoadingDetail ? (
                    <LoadingState>Chargement des étudiants...</LoadingState>
                  ) : detailEtudiants.length === 0 ? (
                    <EmptyState>Aucun étudiant rattaché à cette annonce.</EmptyState>
                  ) : (
                    <EtudiantsListModal>
                      {detailEtudiants.map((e, idx) => (
                        <EtudiantRow key={e.idEtudiant}>
                          <EtudiantInfoModal>
                            <EtudiantNomComplet>
                              {e.prenom} {e.nom}
                            </EtudiantNomComplet>
                            {/* L'adresse n'est plus exposée : le contact passe par la
                                messagerie interne, qui laisse à l'étudiant la maîtrise
                                de son adresse. On montre à la place ce qui aide à
                                décider — niveau et spécialité. */}
                            <EtudiantEmail>
                              {[e.niveauAcademique, e.specialisation || e.filiere]
                                .filter(Boolean).join(' · ') || 'Profil à compléter'}
                            </EtudiantEmail>
                          </EtudiantInfoModal>
                          {/* Compte importé mais jamais activé : le profil est quasi
                              vide et n'a rien à montrer pour l'instant. */}
                          {!e.compteActive ? (
                            <EtudiantSansCv>Compte en cours d&apos;activation</EtudiantSansCv>
                          ) : e.aUnCV ? (
                            <EtudiantCvAction
                              onClick={() => router.push(`/pages/etudiantProfil/${e.idEtudiant}`)}>
                              Voir le profil
                            </EtudiantCvAction>
                          ) : (
                            <EtudiantSansCv>Pas encore de CV</EtudiantSansCv>
                          )}
                        </EtudiantRow>
                      ))}
                    </EtudiantsListModal>
                  )}
                </DetailSection>
              </DetailBody>
            </DetailModal>
          </DetailOverlay>
        )}
      </PageContainer>
    </>
  )
}