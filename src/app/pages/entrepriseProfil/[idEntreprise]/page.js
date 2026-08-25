'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import OffreModal from '@/components/offreModal'
import AppNavbar from '@/components/appNavbar'
import { getUtilisateur } from '@/lib/auth'
import {
  BadgeCheck, Pencil, Info, Calendar, Phone, MapPin, Smartphone,
  Globe, Share2, MessageCircle, Briefcase,
  ArrowRight, ArrowLeft, AlertCircle
} from 'lucide-react'
import {
  PageContainer, BackButton,
  BannerCard, BannerLogo, BannerInfo, BannerName, VerifiedBadge,
  BannerMetaList, BannerMetaItem, BannerMetaLabel, BannerMetaValue,
  BannerEditButton,
  ContentGrid, Section, SectionTitle, SectionContent,
  ContactList, ContactItem, ContactIcon, ContactBody, ContactLabel,
  ContactValue, ContactLink,
  MemberSince, MessageButton,
  OffresSection, OffresList, OffreItem, OffreItemTitle,
  OffreDetails, OffreRow, OffreRowLabel, OffreRowValue, OffreItemButton,
  EmptyOffres, LoadingState, ErrorCard, ErrorIcon
} from '@/components/styleEntrepriseProfil'

export default function EntrepriseProfilPage() {
  const params = useParams()
  const router = useRouter()
  const idEntreprise = params.idEntreprise

  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedOffre, setSelectedOffre] = useState(null)

  // lu apres le montage : localStorage n'existe pas cote serveur
  const [utilisateurConnecte, setUtilisateurConnecte] = useState(null)
  useEffect(() => {
    setUtilisateurConnecte(getUtilisateur())
  }, [])

  const estMonProfil =
    utilisateurConnecte?.typeUtilisateur === 'Entreprise' &&
    parseInt(utilisateurConnecte?.idEntreprise) === parseInt(idEntreprise)
  const estEtudiant = utilisateurConnecte?.typeUtilisateur === 'Etudiant'

  useEffect(() => {
    const fetchProfil = async () => {
      try {
        const res = await fetch(`/api/entrepriseProfil/${idEntreprise}`)
        const result = await res.json()
        if (!res.ok) throw new Error(result.error || `Erreur ${res.status}`)
        setData(result)
      } catch (err) {
        console.error(err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfil()
  }, [idEntreprise])

  const formatDate = (date) => {
    if (!date) return 'Non spécifiée'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
    })
  }

  const formatMemberSince = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('fr-FR', {
      month: 'long', year: 'numeric', timeZone: 'UTC'
    })
  }

  const handleViewOffer = (offre) => {
    setSelectedOffre({
      ...offre,
      nomEntreprise: data.entreprise.nomEntreprise,
      logoEntreprise: data.entreprise.logo
    })
  }

  const handlePostuler = (offre) => {
    setSelectedOffre(null)
    router.push(`/pages/qcm/${offre.idOffre}`)
  }

  const handleModifierOffre = (offre) => {
    setSelectedOffre(null)
    router.push(`/pages/entrepriseModifierOffre/${offre.idOffre}`)
  }

  const handleModifierProfil = () => {
    router.push('/pages/entrepriseModifierProfil')
  }

  const handleMessage = () => {
    if (!data?.entreprise?.idUtilisateur) {
      alert("Impossible d'ouvrir la conversation : identifiant manquant.")
      return
    }
    router.push(`/pages/messages?destinataire=${data.entreprise.idUtilisateur}`)
  }

  if (isLoading) {
    return (
      <>
        <AppNavbar />
        <PageContainer><LoadingState>Chargement du profil...</LoadingState></PageContainer>
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <AppNavbar />
        <PageContainer>
          <ErrorCard>
            <ErrorIcon>
              <AlertCircle size={40} strokeWidth={2} />
            </ErrorIcon>
            <h2>Erreur</h2>
            <p>{error || 'Profil introuvable'}</p>
            <BackButton onClick={() => router.back()}>
              <ArrowLeft size={14} strokeWidth={2} />
              Retour
            </BackButton>
          </ErrorCard>
        </PageContainer>
      </>
    )
  }

  const { entreprise, offres } = data

  return (
    <>
      <AppNavbar />
      <PageContainer>

        <BannerCard>
          <BannerLogo>
            {entreprise.logo ? (
              <img src={entreprise.logo} alt={entreprise.nomEntreprise} />
            ) : (
              entreprise.nomEntreprise?.charAt(0).toUpperCase()
            )}
          </BannerLogo>
          <BannerInfo>
            <BannerName>
              {entreprise.nomEntreprise}
              {entreprise.estVerifie && (
                <VerifiedBadge>
                  <BadgeCheck size={13} strokeWidth={2.5} />
                  Vérifié
                </VerifiedBadge>
              )}
            </BannerName>

            {/* chaque information porte desormais son libelle */}
            <BannerMetaList>
              {entreprise.secteurActivitePrincipal && (
                <BannerMetaItem>
                  <BannerMetaLabel>Secteur d'activité</BannerMetaLabel>
                  <BannerMetaValue>{entreprise.secteurActivitePrincipal}</BannerMetaValue>
                </BannerMetaItem>
              )}
              {entreprise.formeJuridique && (
                <BannerMetaItem>
                  <BannerMetaLabel>Forme juridique</BannerMetaLabel>
                  <BannerMetaValue>{entreprise.formeJuridique}</BannerMetaValue>
                </BannerMetaItem>
              )}
              <BannerMetaItem>
                <BannerMetaLabel>Offres actives</BannerMetaLabel>
                <BannerMetaValue>{offres.length}</BannerMetaValue>
              </BannerMetaItem>
            </BannerMetaList>

            {estMonProfil && (
              <BannerEditButton onClick={handleModifierProfil}>
                <Pencil size={14} strokeWidth={2} />
                Modifier mon profil
              </BannerEditButton>
            )}
          </BannerInfo>
        </BannerCard>

        <ContentGrid>
          <Section>
            <SectionTitle>
              <Phone size={16} strokeWidth={2} />
              Contact
            </SectionTitle>
            <ContactList>
              {entreprise.adresseSiegeSocial && (
                <ContactItem>
                  <ContactIcon><MapPin size={15} strokeWidth={2} /></ContactIcon>
                  <ContactBody>
                    <ContactLabel>Siège social</ContactLabel>
                    <ContactValue>{entreprise.adresseSiegeSocial}</ContactValue>
                  </ContactBody>
                </ContactItem>
              )}
              {entreprise.telephonePrincipal && (
                <ContactItem>
                  <ContactIcon><Phone size={15} strokeWidth={2} /></ContactIcon>
                  <ContactBody>
                    <ContactLabel>Téléphone principal</ContactLabel>
                    <ContactValue>{entreprise.telephonePrincipal}</ContactValue>
                  </ContactBody>
                </ContactItem>
              )}
              {entreprise.telephoneSecondaire && (
                <ContactItem>
                  <ContactIcon><Smartphone size={15} strokeWidth={2} /></ContactIcon>
                  <ContactBody>
                    <ContactLabel>Téléphone secondaire</ContactLabel>
                    <ContactValue>{entreprise.telephoneSecondaire}</ContactValue>
                  </ContactBody>
                </ContactItem>
              )}
              {entreprise.siteWeb && (
                <ContactItem>
                  <ContactIcon><Globe size={15} strokeWidth={2} /></ContactIcon>
                  <ContactBody>
                    <ContactLabel>Site web</ContactLabel>
                    <ContactLink href={entreprise.siteWeb} target="_blank" rel="noopener noreferrer">
                      {entreprise.siteWeb}
                    </ContactLink>
                  </ContactBody>
                </ContactItem>
              )}
              {entreprise.reseauSociaux && (
                <ContactItem>
                  <ContactIcon><Share2 size={15} strokeWidth={2} /></ContactIcon>
                  <ContactBody>
                    <ContactLabel>Réseaux sociaux</ContactLabel>
                    <ContactValue>{entreprise.reseauSociaux}</ContactValue>
                  </ContactBody>
                </ContactItem>
              )}
            </ContactList>

            {!estMonProfil && (
              <MessageButton onClick={handleMessage}>
                <MessageCircle size={15} strokeWidth={2} />
                Envoyer un message
              </MessageButton>
            )}
          </Section>
          <Section>
            <SectionTitle>
              <Info size={16} strokeWidth={2} />
              À propos
            </SectionTitle>
            <SectionContent>
              {entreprise.description || 'Aucune description fournie pour le moment.'}
            </SectionContent>
            {entreprise.dateInscription && (
              <MemberSince>
                <Calendar size={12} strokeWidth={2} />
                Membre depuis {formatMemberSince(entreprise.dateInscription)}
              </MemberSince>
            )}
          </Section>

        </ContentGrid>

        <OffresSection>
          <SectionTitle>
            <Briefcase size={16} strokeWidth={2} />
            Offres disponibles ({offres.length})
          </SectionTitle>

          {offres.length === 0 ? (
            <EmptyOffres>
              {estMonProfil
                ? "Vous n'avez aucune offre active pour le moment."
                : "Cette entreprise n'a aucune offre active pour le moment."}
            </EmptyOffres>
          ) : (
            <OffresList>
              {offres.map((offre) => (
                <OffreItem key={offre.idOffre}>
                  <OffreItemTitle>{offre.titre}</OffreItemTitle>

                  {/* paires libelle / valeur : plus de pastilles sans contexte */}
                  <OffreDetails>
                    {offre.typeStage && (
                      <OffreRow>
                        <OffreRowLabel>Type de stage</OffreRowLabel>
                        <OffreRowValue>{offre.typeStage}</OffreRowValue>
                      </OffreRow>
                    )}
                    {offre.niveauRequis && (
                      <OffreRow>
                        <OffreRowLabel>Niveau requis</OffreRowLabel>
                        <OffreRowValue>{offre.niveauRequis}</OffreRowValue>
                      </OffreRow>
                    )}
                    <OffreRow>
                      <OffreRowLabel>Ville</OffreRowLabel>
                      <OffreRowValue>{offre.ville || 'Non spécifiée'}</OffreRowValue>
                    </OffreRow>
                    <OffreRow>
                      <OffreRowLabel>Durée du stage</OffreRowLabel>
                      <OffreRowValue>{offre.duree || 'Non spécifiée'}</OffreRowValue>
                    </OffreRow>
                    <OffreRow>
                      <OffreRowLabel>Limite de candidature</OffreRowLabel>
                      <OffreRowValue>{formatDate(offre.dateLimites)}</OffreRowValue>
                    </OffreRow>
                  </OffreDetails>

                  <OffreItemButton onClick={() => handleViewOffer(offre)}>
                    Voir les détails
                    <ArrowRight size={13} strokeWidth={2.5} />
                  </OffreItemButton>
                </OffreItem>
              ))}
            </OffresList>
          )}
        </OffresSection>

        {selectedOffre && (
          <OffreModal
            offre={selectedOffre}
            onClose={() => setSelectedOffre(null)}
            onPostuler={estEtudiant ? handlePostuler : null}
            onModifier={estMonProfil ? handleModifierOffre : null}
          />
        )}
      </PageContainer>
    </>
  )
}