'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { fetchAuth, getUtilisateur, getToken } from '@/lib/auth'
import AppNavbar from '@/components/appNavbar'
import {
  BadgeCheck, Pencil, MessageCircle, Info, Calendar, Phone,
  MapPin, Building, Globe, Mail, GraduationCap, BookMarked,
  Target, ArrowLeft, AlertCircle,
  Trash2, AlertTriangle, X
} from 'lucide-react'
import {
  PageContainer, BackButton,
  BannerCard, BannerLogo, BannerInfo, BannerName, VerifiedBadge,
  BannerMetaList, BannerMetaItem, BannerMetaLabel, BannerMetaValue,
  BannerEditButton, BannerMessageButton,
  ContentGrid, Section, SectionTitle, SectionContent,
  ContactList, ContactItem, ContactIcon, ContactBody, ContactLabel,
  ContactValue, ContactLink,
  MemberSince,
  EtudiantsSection, EtudiantsGrid, EtudiantCard, EtudiantAvatar, EtudiantBody,
  EtudiantName, EtudiantInfo, EtudiantInfoItem,
  EmptyEtudiants, LoadingState, ErrorCard, ErrorIcon,
  DangerZone, DangerZoneText, DangerButton,
  ModalOverlay, ModalBox, ModalClose, ModalHeader, ModalIcon, ModalTitle,
  ModalWarning, ModalField, ModalError, ModalActions,
  ModalCancelButton, ModalDeleteButton
} from '@/components/styleUniversiteProfil'

export default function UniversiteProfilPage() {
  const params = useParams()
  const router = useRouter()
  const idUniversite = params.idUniversite

  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // === Suppression de compte ===
  const [modalOuverte, setModalOuverte] = useState(false)
  const [motDePasse, setMotDePasse] = useState('')
  const [confirmationTexte, setConfirmationTexte] = useState('')
  const [erreurSuppression, setErreurSuppression] = useState('')
  const [suppressionEnCours, setSuppressionEnCours] = useState(false)
  // passe à true apres un refus 409 : le clic suivant vaut accord explicite
  const [forcerSuppression, setForcerSuppression] = useState(false)

  // lu apres le montage : localStorage n'existe pas cote serveur
  const [utilisateurConnecte, setUtilisateurConnecte] = useState(null)
  useEffect(() => {
    setUtilisateurConnecte(getUtilisateur())
  }, [])

  const estMonProfil =
    utilisateurConnecte?.typeUtilisateur === 'Universite' &&
    parseInt(utilisateurConnecte?.idUniversite) === parseInt(idUniversite)

  useEffect(() => {
    const fetchProfil = async () => {
      try {
        const res = await fetchAuth(`/api/universiteProfil/${idUniversite}`)
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
  }, [idUniversite])

  const formatMemberSince = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('fr-FR', {
      month: 'long', year: 'numeric', timeZone: 'UTC'
    })
  }

  const handleMessage = () => {
    if (!data?.universite?.idUtilisateur) {
      alert("Impossible d'ouvrir la conversation : identifiant manquant.")
      return
    }
    router.push(`/pages/messages?destinataire=${data.universite.idUtilisateur}`)
  }

  const handleModifierProfil = () => {
    router.push('/pages/universiteModifierProfil')
  }

  const handleVoirEtudiant = (idEtudiant) => {
    router.push(`/pages/etudiantProfil/${idEtudiant}`)
  }

  /* Tout remettre a zero : reouvrir la modale ne doit pas retrouver un
     mot de passe saisi ni un « forcer » accorde precedemment. */
  const fermerModal = () => {
    if (suppressionEnCours) return
    setModalOuverte(false)
    setMotDePasse('')
    setConfirmationTexte('')
    setErreurSuppression('')
    setForcerSuppression(false)
  }

  const suppressionPrete =
    motDePasse.length > 0 && confirmationTexte === 'SUPPRIMER'

  const handleSupprimerCompte = async () => {
    if (!suppressionPrete || suppressionEnCours) return
    setErreurSuppression('')
    setSuppressionEnCours(true)

    try {
      const res = await fetch(`/api/universiteProfil/${idUniversite}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          motDePasse,
          confirmation: 'SUPPRIMER',
          forcer: forcerSuppression
        })
      })
      const resultat = await res.json()

      if (!res.ok) {
        setErreurSuppression(resultat.error || `Erreur ${res.status}`)
        if (resultat.code === 'ETUDIANTS_RATTACHES') setForcerSuppression(true)
        setSuppressionEnCours(false)
        return
      }

      /* Le compte n'existe plus : le jeton en memoire ne vaut plus rien,
         on nettoie avant de sortir, puis retour a l'accueil.

         replace() et non push() : revenir en arriere ramenerait sur un
         profil qui n'existe plus, et le fetch echouerait en « Université
         introuvable ». On efface l'etape de l'historique. */
      localStorage.clear()
      router.replace('/')
    } catch (err) {
      console.error(err)
      setErreurSuppression('Erreur réseau, réessayez.')
      setSuppressionEnCours(false)
    }
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

  const { universite, etudiants } = data

  return (
    <>
      <AppNavbar />
      <PageContainer>

        {/* === Bannière université === */}
        <BannerCard>
          <BannerLogo>
            {universite.logo ? (
              <img src={universite.logo} alt={universite.nomUniversite} />
            ) : (
              universite.sigleUniversitaire?.charAt(0).toUpperCase() ||
              universite.nomUniversite?.charAt(0).toUpperCase()
            )}
          </BannerLogo>
          <BannerInfo>
            <BannerName>
              {universite.nomUniversite}
              {universite.estVerifie && (
                <VerifiedBadge>
                  <BadgeCheck size={13} strokeWidth={2.5} />
                  Vérifiée
                </VerifiedBadge>
              )}
            </BannerName>

            {/* chaque information porte son libelle */}
            <BannerMetaList>
              {universite.sigleUniversitaire && (
                <BannerMetaItem>
                  <BannerMetaLabel>Sigle</BannerMetaLabel>
                  <BannerMetaValue>{universite.sigleUniversitaire}</BannerMetaValue>
                </BannerMetaItem>
              )}
              {universite.ville && (
                <BannerMetaItem>
                  <BannerMetaLabel>Ville</BannerMetaLabel>
                  <BannerMetaValue>{universite.ville}</BannerMetaValue>
                </BannerMetaItem>
              )}
              <BannerMetaItem>
                <BannerMetaLabel>Étudiants rattachés</BannerMetaLabel>
                <BannerMetaValue>{etudiants.length}</BannerMetaValue>
              </BannerMetaItem>
            </BannerMetaList>

            {estMonProfil ? (
              <BannerEditButton onClick={handleModifierProfil}>
                <Pencil size={14} strokeWidth={2} />
                Modifier mon profil
              </BannerEditButton>
            ) : (
              <BannerMessageButton onClick={handleMessage}>
                <MessageCircle size={14} strokeWidth={2} />
                Envoyer un message
              </BannerMessageButton>
            )}
          </BannerInfo>
        </BannerCard>

        {/* === Grid : à propos / contact === */}
        <ContentGrid>
          <Section>
            <SectionTitle>
              <Info size={16} strokeWidth={2} />
              À propos
            </SectionTitle>
            <SectionContent>
              {universite.nomUniversite}
              {universite.sigleUniversitaire && ` (${universite.sigleUniversitaire})`}
              {' '}est un établissement d&apos;enseignement supérieur partenaire de la plateforme Stage Share,
              accompagnant ses étudiants dans leur recherche d&apos;opportunités professionnelles.
            </SectionContent>
            {universite.dateInscription && (
              <MemberSince>
                <Calendar size={12} strokeWidth={2} />
                Membre depuis {formatMemberSince(universite.dateInscription)}
              </MemberSince>
            )}
          </Section>

          <Section>
            <SectionTitle>
              <Phone size={16} strokeWidth={2} />
              Contact
            </SectionTitle>
            <ContactList>
              {universite.adresseUniversite && (
                <ContactItem>
                  <ContactIcon><MapPin size={15} strokeWidth={2} /></ContactIcon>
                  <ContactBody>
                    <ContactLabel>Adresse</ContactLabel>
                    <ContactValue>{universite.adresseUniversite}</ContactValue>
                  </ContactBody>
                </ContactItem>
              )}
              {universite.ville && (
                <ContactItem>
                  <ContactIcon><Building size={15} strokeWidth={2} /></ContactIcon>
                  <ContactBody>
                    <ContactLabel>Ville</ContactLabel>
                    <ContactValue>{universite.ville}</ContactValue>
                  </ContactBody>
                </ContactItem>
              )}
              {universite.telephoneUniversite && (
                <ContactItem>
                  <ContactIcon><Phone size={15} strokeWidth={2} /></ContactIcon>
                  <ContactBody>
                    <ContactLabel>Téléphone</ContactLabel>
                    <ContactValue>{universite.telephoneUniversite}</ContactValue>
                  </ContactBody>
                </ContactItem>
              )}
              {universite.siteWeb && (
                <ContactItem>
                  <ContactIcon><Globe size={15} strokeWidth={2} /></ContactIcon>
                  <ContactBody>
                    <ContactLabel>Site web</ContactLabel>
                    <ContactLink href={universite.siteWeb} target="_blank" rel="noopener noreferrer">
                      {universite.siteWeb}
                    </ContactLink>
                  </ContactBody>
                </ContactItem>
              )}
              {universite.emailUtilisateur && (
                <ContactItem>
                  <ContactIcon><Mail size={15} strokeWidth={2} /></ContactIcon>
                  <ContactBody>
                    <ContactLabel>Email</ContactLabel>
                    <ContactValue>{universite.emailUtilisateur}</ContactValue>
                  </ContactBody>
                </ContactItem>
              )}
            </ContactList>
          </Section>
        </ContentGrid>

        {/* === Liste des étudiants rattachés === */}
        <EtudiantsSection>
          <SectionTitle>
            <GraduationCap size={16} strokeWidth={2} />
            {estMonProfil ? 'Nos étudiants' : 'Étudiants rattachés'} ({etudiants.length})
          </SectionTitle>

          {etudiants.length === 0 ? (
            <EmptyEtudiants>
              {estMonProfil
                ? "Aucun étudiant n'est encore rattaché à votre université. Quand un étudiant s'inscrit en mentionnant votre nom, il apparaîtra ici automatiquement."
                : "Aucun étudiant rattaché à cette université pour le moment."}
            </EmptyEtudiants>
          ) : (
            <EtudiantsGrid>
              {etudiants.map((e) => (
                <EtudiantCard
                  key={e.idEtudiant}
                  onClick={() => handleVoirEtudiant(e.idEtudiant)}
                >
                  <EtudiantAvatar>
                    {e.photoProfil ? (
                      <img src={e.photoProfil} alt={e.prenomEtudiant} />
                    ) : (
                      (e.prenomEtudiant?.charAt(0) || '') + (e.nomEtudiant?.charAt(0) || '')
                    )}
                  </EtudiantAvatar>

                  <EtudiantBody>
                    <EtudiantName>{e.prenomEtudiant} {e.nomEtudiant}</EtudiantName>
                    <EtudiantInfo>
                      {e.niveauAcademique && (
                        <EtudiantInfoItem>
                          <BookMarked size={12} strokeWidth={2} />
                          {e.niveauAcademique}
                        </EtudiantInfoItem>
                      )}
                      {e.filiere && (
                        <EtudiantInfoItem>
                          <Target size={12} strokeWidth={2} />
                          {e.filiere}
                        </EtudiantInfoItem>
                      )}
                    </EtudiantInfo>
                  </EtudiantBody>
                </EtudiantCard>
              ))}
            </EtudiantsGrid>
          )}
        </EtudiantsSection>

        {/* === Zone de danger : uniquement sur son propre profil === */}
        {estMonProfil && (
          <DangerZone>
            <DangerZoneText>
              <h4>Supprimer mon compte</h4>
              <p>
                Efface définitivement le profil de votre établissement et vos
                messages. Les comptes de vos étudiants sont conservés, mais
                perdent leur rattachement. Cette action ne peut pas être annulée.
              </p>
            </DangerZoneText>
            <DangerButton onClick={() => setModalOuverte(true)}>
              <Trash2 size={14} strokeWidth={2} />
              Supprimer mon compte
            </DangerButton>
          </DangerZone>
        )}

        {/* === Modale de confirmation === */}
        {modalOuverte && (
          <ModalOverlay onClick={fermerModal}>
            <ModalBox onClick={(e) => e.stopPropagation()}>
              <ModalClose onClick={fermerModal} aria-label="Fermer">
                <X size={18} strokeWidth={2} />
              </ModalClose>

              <ModalHeader>
                <ModalIcon>
                  <AlertTriangle size={24} strokeWidth={2} />
                </ModalIcon>
                <ModalTitle>Supprimer mon compte</ModalTitle>
              </ModalHeader>

              <ModalWarning>
                Cette action est <strong>irréversible</strong>. Le profil de
                votre établissement et vos messages seront définitivement
                effacés. Les comptes de vos étudiants ne sont pas supprimés :
                ils perdent simplement leur rattachement et devront le refaire
                si vous revenez sur la plateforme.
              </ModalWarning>

              <ModalField>
                <label htmlFor="mdpSuppression">Mot de passe</label>
                <input
                  id="mdpSuppression"
                  type="password"
                  autoComplete="current-password"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="Votre mot de passe"
                  disabled={suppressionEnCours}
                />
              </ModalField>

              <ModalField>
                <label htmlFor="confirmSuppression">
                  Tapez <code>SUPPRIMER</code> pour confirmer
                </label>
                <input
                  id="confirmSuppression"
                  type="text"
                  value={confirmationTexte}
                  onChange={(e) => setConfirmationTexte(e.target.value)}
                  placeholder="SUPPRIMER"
                  disabled={suppressionEnCours}
                />
              </ModalField>

              {erreurSuppression && <ModalError>{erreurSuppression}</ModalError>}

              <ModalActions>
                <ModalCancelButton onClick={fermerModal} disabled={suppressionEnCours}>
                  Annuler
                </ModalCancelButton>
                <ModalDeleteButton
                  onClick={handleSupprimerCompte}
                  disabled={!suppressionPrete || suppressionEnCours}
                >
                  {suppressionEnCours
                    ? 'Suppression...'
                    : forcerSuppression
                      ? 'Supprimer quand même'
                      : 'Supprimer définitivement'}
                </ModalDeleteButton>
              </ModalActions>
            </ModalBox>
          </ModalOverlay>
        )}
      </PageContainer>
    </>
  )
}