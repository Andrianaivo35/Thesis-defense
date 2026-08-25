'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUtilisateur } from '@/lib/auth'
import Image from 'next/image'
import {
  GraduationCap, Building2, Landmark, Briefcase, BookOpen,
  ArrowRight, X, MapPin, CalendarDays, CalendarClock, Calendar,
  FileText, ClipboardList, Building, Clock, Laptop, Wallet,
  Target, Send, Star, UserRound,
  UserPlus, LogIn, UserCog, Rocket
} from 'lucide-react'
import {
  PageWrapper,
  Navbar, LogoArea, LogoMark, LogoText,
  NavMenu, NavLink, ConnectButton,
  HeroSection, HeroLeft, HeroTitle, HeroSubtitle, HeroText,
  HeroRight, HeroImageWrapper, HeroImagePlaceholder,
  ModalOverlay, ModalCard, ModalClose,
  ModalHeader, ModalTitle, ModalSubtitle,
  RolesGrid, RoleCard, RoleIcon, RoleName, RoleDesc, RoleArrow,

  GuideSection, GuideTitle, GuideContent,
  GuideImageSide, GuideImageWrapper, GuideImagePlaceholder,
  GuideStepsSide, GuideStep, GuideStepNumber, GuideStepInfo,
  GuideStepEyebrow, GuideStepTitle, GuideStepText,

  CarouselSection, CarouselTitle, HorizontalScroll,
  OffreSmallCard, OffreCompanyRow, OffreCompanyLogo, OffreCompanyName,
  OffreSmallTitle, OffreSmallMeta, OffreMetaItem, OffreSmallButton,
  EntrepriseSmallCard, EntrepriseSmallLogo, EntrepriseSmallName,
  EntrepriseSmallSector, EntrepriseSmallDesc,
  EmptyHint,
  Footer, FooterContent, FooterColumn, FooterLogo, FooterText, FooterLinks,
  FooterLink, FooterBottom,

  // Modal offre intégré
  DetailModalCard, DetailModalHeader, DetailCompanyLogo, DetailHeaderInfo,
  DetailCompanyName, DetailOfferTitle, DetailBadges, DetailBadge,
  DetailModalBody, DetailSection, DetailSectionTitle, DetailText,
  DetailInfoGrid, DetailInfoItem, DetailInfoLabel, DetailInfoValue,
  DetailCompetencesList, DetailCompetenceBadge,
  DetailModalFooter, PostulerButton,

  // Modal d'invitation à se connecter
  AuthChoiceRow, AuthChoiceCard, AuthChoiceIcon,
  AuthChoiceTitle, AuthChoiceDesc, AuthChoiceAction
} from '@/components/styleAccueil'

export default function Accueil() {
  const router = useRouter()
  const [offres, setOffres] = useState([])
  const [entreprises, setEntreprises] = useState([])

  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [selectedOffre, setSelectedOffre] = useState(null)
  const [showAuthRequiredModal, setShowAuthRequiredModal] = useState(false)

  useEffect(() => {
    fetch('/api/listeOffre')
      .then(r => r.json())
      .then(d => setOffres(d.offres || []))
      .catch(() => {})

    fetch('/api/listeEntreprises')
      .then(r => r.json())
      .then(d => setEntreprises(d.entreprises || []))
      .catch(() => {})
  }, [])

  const formatDate = (date) => {
    if (!date) return 'Non spécifiée'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  const scrollToSection = (id) => {
    const section = document.getElementById(id)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Clic sur "Postuler" depuis le modal d'offre
  const handlePostuler = () => {
    const user = getUtilisateur()

    if (user && user.typeUtilisateur === 'Etudiant') {
      // Étudiant connecté → on va au QCM
      const idOffre = selectedOffre.idOffre
      setSelectedOffre(null)
      router.push(`/pages/qcm/${idOffre}`)
    } else {
      // Pas connecté ou pas étudiant → invitation
      setSelectedOffre(null)
      setShowAuthRequiredModal(true)
    }
  }

  const roles = [
    {
      key: 'etudiant', Icon: GraduationCap, nom: 'Étudiant',
      desc: 'Trouvez votre stage et développez votre parcours.',
      route: '/pages/etudiantLogin', couleur: 'green'
    },
    {
      key: 'entreprise', Icon: Building2, nom: 'Entreprise',
      desc: 'Publiez vos offres et recrutez les meilleurs talents.',
      route: '/pages/entrepriseLogin', couleur: 'purple'
    },
    {
      key: 'universite', Icon: Landmark, nom: 'Université',
      desc: 'Suivez vos étudiants et leur insertion professionnelle.',
      route: '/pages/universiteLogin', couleur: 'blue'
    }
  ]

  const rolesInscription = [
    {
      key: 'etudiant', Icon: GraduationCap, nom: 'Étudiant',
      desc: 'Créez votre profil et trouvez votre stage idéal.',
      route: '/pages/etudiantRegistreInfo', couleur: 'green'
    },
    {
      key: 'entreprise', Icon: Building2, nom: 'Entreprise',
      desc: 'Inscrivez votre entreprise pour publier vos offres.',
      route: '/pages/entrepriseRegistreInfo', couleur: 'purple'
    },
    {
      key: 'universite', Icon: Landmark, nom: 'Université',
      desc: 'Enregistrez votre établissement et suivez vos étudiants.',
      route: '/pages/universiteRegistreInfo', couleur: 'blue'
    }
  ]

  // Étapes du parcours utilisateur
  const etapes = [
    {
      Icon: UserPlus,
      titre: 'Inscrivez-vous',
      texte: "Créez votre compte en quelques clics selon votre profil : étudiant, entreprise ou université."
    },
    {
      Icon: LogIn,
      titre: 'Connectez-vous',
      texte: 'Accédez immédiatement à votre espace personnel et découvrez la plateforme.'
    },
    {
      Icon: UserCog,
      titre: 'Complétez votre profil',
      texte: 'Ajoutez vos informations pour optimiser vos chances et votre visibilité.'
    },
    {
      Icon: Rocket,
      titre: 'Lancez-vous',
      texte: 'Postulez à des offres, publiez vos stages ou suivez vos étudiants.'
    }
  ]

  return (
    <PageWrapper>
      <Navbar>
        <LogoArea onClick={() => router.push('/')}>
          <Image
            src="/images/14.png"
            width={100}
            height={50}
            alt='logo'
          />
          <LogoText>Stage Share</LogoText>
        </LogoArea>

        <NavMenu>
          <NavLink onClick={() => scrollToSection('section-accueil')}>À propos</NavLink>
          <NavLink onClick={() => scrollToSection('section-offres')}>Offres de stage</NavLink>
          <NavLink onClick={() => setShowRegisterModal(true)}>Créer un compte</NavLink>
          <ConnectButton onClick={() => setShowLoginModal(true)}>Se connecter</ConnectButton>
        </NavMenu>
      </Navbar>

      <HeroSection id="section-accueil">
        <HeroLeft>
          <HeroTitle>Bienvenue sur <span>Stage Share</span></HeroTitle>
          <HeroSubtitle>
            La plateforme qui relie étudiants, entreprises et universités.
          </HeroSubtitle>
          <HeroText>
            Trouvez le stage qui vous correspond, recrutez les meilleurs talents,
            suivez le parcours de vos étudiants. Stage Share simplifie chaque étape
            de la rencontre entre le monde académique et professionnel.
          </HeroText>
        </HeroLeft>

        <HeroRight>
          <HeroImageWrapper>
            <HeroImagePlaceholder>
              <Image
                src="/images/1.png"
                width={400}
                height={200}
                alt='image'
              />
            </HeroImagePlaceholder>
          </HeroImageWrapper>
        </HeroRight>
      </HeroSection>

      {/* === DE L'INSCRIPTION AU STAGE === */}
      <GuideSection>
        <GuideTitle>De l'inscription au stage</GuideTitle>
        <GuideContent>
          <GuideImageSide>
            <GuideImageWrapper>
              <Image
                src="/images/5.png"
                width={300}
                height={200}
                alt='image 5'
              />
            </GuideImageWrapper>
          </GuideImageSide>

          <GuideStepsSide>
            {etapes.map((e, i) => (
              <GuideStep key={e.titre}>
                <GuideStepNumber>
                  <e.Icon size={20} strokeWidth={1.8} />
                </GuideStepNumber>
                <GuideStepInfo>
                  <GuideStepEyebrow>ÉTAPE {i + 1}</GuideStepEyebrow>
                  <GuideStepTitle>{e.titre}</GuideStepTitle>
                  <GuideStepText>{e.texte}</GuideStepText>
                </GuideStepInfo>
              </GuideStep>
            ))}
          </GuideStepsSide>
        </GuideContent>
      </GuideSection>

      {/* === DERNIÈRES OFFRES === */}
      <CarouselSection id="section-offres">
        <CarouselTitle>Les dernières offres</CarouselTitle>
        {offres.length === 0 ? (
          <EmptyHint>Aucune offre disponible pour le moment.</EmptyHint>
        ) : (
          <HorizontalScroll>
            {offres.map(o => (
              <OffreSmallCard key={o.idOffre}>
                <OffreCompanyRow>
                  <OffreCompanyLogo>
                    {o.logoEntreprise ? (
                      <img src={o.logoEntreprise} alt={o.nomEntreprise} />
                    ) : (
                      o.nomEntreprise?.charAt(0).toUpperCase()
                    )}
                  </OffreCompanyLogo>
                  <OffreCompanyName>{o.nomEntreprise}</OffreCompanyName>
                </OffreCompanyRow>
                <OffreSmallTitle>{o.titre}</OffreSmallTitle>
                <OffreSmallMeta>
                  <OffreMetaItem>
                    <MapPin size={14} /> {o.ville || 'Non spécifiée'}
                  </OffreMetaItem>
                  <OffreMetaItem>
                    <CalendarDays size={14} /> Limite : {formatDate(o.dateLimites)}
                  </OffreMetaItem>
                </OffreSmallMeta>
                <OffreSmallButton onClick={() => setSelectedOffre(o)}>
                  Voir plus <ArrowRight size={15} />
                </OffreSmallButton>
              </OffreSmallCard>
            ))}
          </HorizontalScroll>
        )}
      </CarouselSection>

      {/* === LES ENTREPRISES === */}
      <CarouselSection>
        <CarouselTitle>Les entreprises</CarouselTitle>
        {entreprises.length === 0 ? (
          <EmptyHint>Aucune entreprise pour le moment.</EmptyHint>
        ) : (
          <HorizontalScroll>
            {entreprises.map(e => (
              <EntrepriseSmallCard
                key={e.idEntreprise}
                onClick={() => router.push(`/pages/entrepriseProfil/${e.idEntreprise}`)}
              >
                <EntrepriseSmallLogo>
                  {e.logo ? (
                    <img src={e.logo} alt={e.nomEntreprise} />
                  ) : (
                    e.nomEntreprise?.charAt(0).toUpperCase()
                  )}
                </EntrepriseSmallLogo>
                <EntrepriseSmallName>{e.nomEntreprise}</EntrepriseSmallName>
                {e.secteurActivitePrincipal && (
                  <EntrepriseSmallSector>{e.secteurActivitePrincipal}</EntrepriseSmallSector>
                )}
                {e.description && (
                  <EntrepriseSmallDesc>
                    {e.description.substring(0, 80)}{e.description.length > 80 ? '...' : ''}
                  </EntrepriseSmallDesc>
                )}
              </EntrepriseSmallCard>
            ))}
          </HorizontalScroll>
        )}
      </CarouselSection>

      {/* === FOOTER === */}
      <Footer>
        <FooterContent>
          <FooterColumn>
            <FooterLogo>
              <LogoMark>SS</LogoMark>
              <LogoText style={{ color: 'white' }}>Stage Share</LogoText>
            </FooterLogo>
            <FooterText>
              La plateforme qui simplifie la rencontre entre étudiants,
              entreprises et universités.
            </FooterText>
          </FooterColumn>

          <FooterColumn>
            <h4>Navigation</h4>
            <FooterLinks>
              <FooterLink onClick={() => router.push('/')}>Accueil</FooterLink>
              <FooterLink onClick={() => router.push('/pages/listeOffre')}>Offres de stage</FooterLink>
              <FooterLink onClick={() => router.push('/pages/aPropos')}>À propos</FooterLink>
            </FooterLinks>
          </FooterColumn>

          <FooterColumn>
            <h4>Se connecter</h4>
            <FooterLinks>
              <FooterLink onClick={() => router.push('/pages/etudiantLogin')}>Étudiant</FooterLink>
              <FooterLink onClick={() => router.push('/pages/entrepriseLogin')}>Entreprise</FooterLink>
              <FooterLink onClick={() => router.push('/pages/universiteLogin')}>Université</FooterLink>
            </FooterLinks>
          </FooterColumn>
        </FooterContent>

        <FooterBottom>
          © {new Date().getFullYear()} Stage Share. Tous droits réservés.
        </FooterBottom>
      </Footer>

      {/* === MODAL CONNEXION === */}
      {showLoginModal && (
        <ModalOverlay onClick={() => setShowLoginModal(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalClose onClick={() => setShowLoginModal(false)}><X size={16} /></ModalClose>
            <ModalHeader>
              <ModalTitle>Bienvenue sur Stage Share</ModalTitle>
              <ModalSubtitle>Comment souhaitez-vous vous connecter ?</ModalSubtitle>
            </ModalHeader>
            <RolesGrid>
              {roles.map(r => (
                <RoleCard
                  key={r.key}
                  $couleur={r.couleur}
                  onClick={() => { setShowLoginModal(false); router.push(r.route) }}
                >
                  <RoleIcon><r.Icon size={30} strokeWidth={1.6} /></RoleIcon>
                  <RoleName>{r.nom}</RoleName>
                  <RoleDesc>{r.desc}</RoleDesc>
                  <RoleArrow><ArrowRight size={19} /></RoleArrow>
                </RoleCard>
              ))}
            </RolesGrid>
          </ModalCard>
        </ModalOverlay>
      )}

      {/* === MODAL CRÉATION DE COMPTE === */}
      {showRegisterModal && (
        <ModalOverlay onClick={() => setShowRegisterModal(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalClose onClick={() => setShowRegisterModal(false)}><X size={16} /></ModalClose>
            <ModalHeader>
              <ModalTitle>Rejoignez Stage Share</ModalTitle>
              <ModalSubtitle>Quel type de compte souhaitez-vous créer ?</ModalSubtitle>
            </ModalHeader>
            <RolesGrid>
              {rolesInscription.map(r => (
                <RoleCard
                  key={r.key}
                  $couleur={r.couleur}
                  onClick={() => { setShowRegisterModal(false); router.push(r.route) }}
                >
                  <RoleIcon><r.Icon size={30} strokeWidth={1.6} /></RoleIcon>
                  <RoleName>{r.nom}</RoleName>
                  <RoleDesc>{r.desc}</RoleDesc>
                  <RoleArrow><ArrowRight size={19} /></RoleArrow>
                </RoleCard>
              ))}
            </RolesGrid>
          </ModalCard>
        </ModalOverlay>
      )}

      {/* === MODAL DÉTAILS DE L'OFFRE (intégré, pas importé) === */}
      {selectedOffre && (
        <ModalOverlay onClick={() => setSelectedOffre(null)}>
          <DetailModalCard onClick={(e) => e.stopPropagation()}>
            <ModalClose onClick={() => setSelectedOffre(null)}><X size={16} /></ModalClose>

            <DetailModalHeader>
              <DetailCompanyLogo>
                {selectedOffre.logoEntreprise ? (
                  <img src={selectedOffre.logoEntreprise} alt={selectedOffre.nomEntreprise} />
                ) : (
                  selectedOffre.nomEntreprise?.charAt(0).toUpperCase()
                )}
              </DetailCompanyLogo>
              <DetailHeaderInfo>
                <DetailCompanyName>{selectedOffre.nomEntreprise}</DetailCompanyName>
                <DetailOfferTitle>{selectedOffre.titre}</DetailOfferTitle>
                <DetailBadges>
                  {selectedOffre.typeStage && <DetailBadge>{selectedOffre.typeStage}</DetailBadge>}
                  {selectedOffre.niveauRequis && (
                    <DetailBadge $variant="purple">{selectedOffre.niveauRequis}</DetailBadge>
                  )}
                  {selectedOffre.domaine && (
                    <DetailBadge $variant="blue">{selectedOffre.domaine}</DetailBadge>
                  )}
                </DetailBadges>
              </DetailHeaderInfo>
            </DetailModalHeader>

            <DetailModalBody>
              {selectedOffre.description && (
                <DetailSection>
                  <DetailSectionTitle><FileText size={16} /> Description</DetailSectionTitle>
                  <DetailText>{selectedOffre.description}</DetailText>
                </DetailSection>
              )}

              <DetailSection>
                <DetailSectionTitle><ClipboardList size={16} /> Informations clés</DetailSectionTitle>
                <DetailInfoGrid>
                  <DetailInfoItem>
                    <DetailInfoLabel><MapPin size={13} /> Lieu</DetailInfoLabel>
                    <DetailInfoValue>{selectedOffre.lieu || selectedOffre.ville || 'Non spécifié'}</DetailInfoValue>
                  </DetailInfoItem>
                  <DetailInfoItem>
                    <DetailInfoLabel><Building size={13} /> Ville</DetailInfoLabel>
                    <DetailInfoValue>{selectedOffre.ville || 'Non spécifiée'}</DetailInfoValue>
                  </DetailInfoItem>
                  <DetailInfoItem>
                    <DetailInfoLabel><Clock size={13} /> Durée</DetailInfoLabel>
                    <DetailInfoValue>{selectedOffre.duree || 'Non spécifiée'}</DetailInfoValue>
                  </DetailInfoItem>
                  <DetailInfoItem>
                    <DetailInfoLabel><Laptop size={13} /> Télétravail</DetailInfoLabel>
                    <DetailInfoValue>{selectedOffre.accepteTeletravail || 'Non spécifié'}</DetailInfoValue>
                  </DetailInfoItem>
                  <DetailInfoItem>
                    <DetailInfoLabel><Wallet size={13} /> Rémunération</DetailInfoLabel>
                    <DetailInfoValue>{selectedOffre.remuneration || 'Non spécifiée'}</DetailInfoValue>
                  </DetailInfoItem>
                  <DetailInfoItem>
                    <DetailInfoLabel><Calendar size={13} /> Date de début</DetailInfoLabel>
                    <DetailInfoValue>{formatDate(selectedOffre.dateDebut)}</DetailInfoValue>
                  </DetailInfoItem>
                  <DetailInfoItem>
                    <DetailInfoLabel><Calendar size={13} /> Date de fin</DetailInfoLabel>
                    <DetailInfoValue>{formatDate(selectedOffre.dateFin)}</DetailInfoValue>
                  </DetailInfoItem>
                  <DetailInfoItem>
                    <DetailInfoLabel><CalendarClock size={13} /> Limite de candidature</DetailInfoLabel>
                    <DetailInfoValue>{formatDate(selectedOffre.dateLimites)}</DetailInfoValue>
                  </DetailInfoItem>
                </DetailInfoGrid>
              </DetailSection>

              {selectedOffre.competences && selectedOffre.competences.length > 0 && (
                <DetailSection>
                  <DetailSectionTitle><Target size={16} /> Compétences requises</DetailSectionTitle>
                  <DetailCompetencesList>
                    {selectedOffre.competences.map((c, idx) => (
                      <DetailCompetenceBadge
                        key={idx}
                        $obligatoire={c.estObligatoire}
                      >
                        {c.nom}
                        {c.niveauSouhaitee && <small> · {c.niveauSouhaitee}</small>}
                        {c.estObligatoire && <strong><Star size={12} fill="currentColor" /></strong>}
                      </DetailCompetenceBadge>
                    ))}
                  </DetailCompetencesList>
                </DetailSection>
              )}
            </DetailModalBody>

            <DetailModalFooter>
              <PostulerButton onClick={handlePostuler}>
                <Send size={17} /> Postuler à cette offre
              </PostulerButton>
            </DetailModalFooter>
          </DetailModalCard>
        </ModalOverlay>
      )}

      {/* === MODAL : invitation à se connecter / s'inscrire pour postuler === */}
      {showAuthRequiredModal && (
        <ModalOverlay onClick={() => setShowAuthRequiredModal(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalClose onClick={() => setShowAuthRequiredModal(false)}><X size={16} /></ModalClose>

            <ModalHeader>
              <ModalTitle>Connectez-vous pour postuler</ModalTitle>
              <ModalSubtitle>
                Pour postuler à une offre, vous devez avoir un compte étudiant.
              </ModalSubtitle>
            </ModalHeader>

            <AuthChoiceRow>
              <AuthChoiceCard
                onClick={() => {
                  setShowAuthRequiredModal(false)
                  router.push('/pages/etudiantRegistreInfo')
                }}
              >
                <AuthChoiceIcon><GraduationCap size={36} strokeWidth={1.5} /></AuthChoiceIcon>
                <AuthChoiceTitle>Je n'ai pas encore de compte</AuthChoiceTitle>
                <AuthChoiceDesc>
                  Inscrivez-vous gratuitement en tant qu'étudiant pour postuler.
                </AuthChoiceDesc>
                <AuthChoiceAction>Créer un compte <ArrowRight size={15} /></AuthChoiceAction>
              </AuthChoiceCard>

              <AuthChoiceCard
                $secondary
                onClick={() => {
                  setShowAuthRequiredModal(false)
                  router.push('/pages/etudiantLogin')
                }}
              >
                <AuthChoiceIcon><UserRound size={36} strokeWidth={1.5} /></AuthChoiceIcon>
                <AuthChoiceTitle>J'ai déjà un compte</AuthChoiceTitle>
                <AuthChoiceDesc>
                  Connectez-vous avec votre compte étudiant existant.
                </AuthChoiceDesc>
                <AuthChoiceAction>Se connecter <ArrowRight size={15} /></AuthChoiceAction>
              </AuthChoiceCard>
            </AuthChoiceRow>
          </ModalCard>
        </ModalOverlay>
      )}
    </PageWrapper>
  )
}