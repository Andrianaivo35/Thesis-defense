'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { fetchAuth, getUtilisateur, getToken } from '@/lib/auth'
import AppNavbar from '@/components/appNavbar'
import {
  Mail, Phone, MapPin, Pencil, MessageCircle, PartyPopper,
  BookOpen, GraduationCap, Target, Briefcase, FileText, Sparkles,
  ExternalLink, Heart, AlertCircle, ArrowLeft, ArrowRight
} from 'lucide-react'
import {
  PageContainer, BackButton,
  BannerCard, BannerAvatar, BannerInfo, BannerName, BannerSubtitle,
  ContactBar, ContactItem, BannerMessageButton, BannerEditButton,
  ContentGrid, GridColumn, Section, SectionTitle,
  InfoList, InfoItem, InfoLabel, InfoValue,
  ParcoursList, ParcoursCard, ParcoursTitle,
  ParcoursDetails, ParcoursRow, ParcoursRowLabel, ParcoursRowValue, ParcoursLink,
  InterestList, InterestItem, InterestDomaine, InterestMission,
  SkillList, SkillChip,
  BioText, EmptyState, EmptyStateLink, LoadingState, ErrorCard, ErrorIcon,
  StageBanner, StageIcon, StageContent, StageTitle, StageDetails,
  DocumentList, DocumentLink
} from '@/components/styleEtudiantProfil'

export default function EtudiantProfilPage() {
  const params = useParams()
  const router = useRouter()
  const idEtudiant = params.idEtudiant

  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // lu apres le montage : localStorage n'existe pas cote serveur
  const [utilisateurConnecte, setUtilisateurConnecte] = useState(null)
  useEffect(() => {
    setUtilisateurConnecte(getUtilisateur())
  }, [])

  const estMonProfil =
    utilisateurConnecte?.typeUtilisateur === 'Etudiant' &&
    parseInt(utilisateurConnecte?.idEtudiant) === parseInt(idEtudiant)

  useEffect(() => {
    const fetchProfil = async () => {
      try {
        const res = await fetchAuth(`/api/etudiantProfil/${idEtudiant}`)
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
  }, [idEtudiant])

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
    })
  }

  const formatBoolean = (value) => {
    if (value === true || value === 'true') return 'Oui'
    if (value === false || value === 'false') return 'Non'
    return 'Non spécifié'
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

  const { etudiant, competences, preferenceStage, parcours, centresInteret, stageRecrute, cv } = data

  /* Le CV n'est pas accessible publiquement : on le récupère avec le jeton
     puis on l'ouvre depuis un blob (même pattern que etudiantCV). */
  const handleOuvrirCv = async () => {
    try {
      const res = await fetch(`/api/fichier/cv/${cv.idCV}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      if (!res.ok) throw new Error('Document indisponible')
      const blob = await res.blob()
      window.open(URL.createObjectURL(blob), '_blank')
    } catch (err) {
      alert('Erreur : ' + err.message)
    }
  }

  const handleMessage = () => {
    if (!etudiant.idUtilisateur) {
      alert("Impossible d'ouvrir la conversation : identifiant manquant.")
      return
    }
    router.push(`/pages/messages?destinataire=${etudiant.idUtilisateur}`)
  }

  const handleModifier = () => {
    router.push('/pages/etudiantModifierProfil')
  }

  return (
    <>
      <AppNavbar />
      <PageContainer>

        {/* === Bannière === */}
        <BannerCard>
          <BannerAvatar>
            {etudiant.photoProfil ? (
              <img src={etudiant.photoProfil} alt={etudiant.prenomEtudiant} />
            ) : (
              (etudiant.prenomEtudiant?.charAt(0) || '') + (etudiant.nomEtudiant?.charAt(0) || '')
            )}
          </BannerAvatar>
          <BannerInfo>
            <BannerName>{etudiant.prenomEtudiant} {etudiant.nomEtudiant}</BannerName>
            <BannerSubtitle>
              {etudiant.niveauAcademique}
              {etudiant.filiere && ` • ${etudiant.filiere}`}
              {etudiant.specialisation && ` • ${etudiant.specialisation}`}
            </BannerSubtitle>
            <ContactBar>
              <ContactItem>
                <Mail size={13} strokeWidth={2} />
                {etudiant.emailUtilisateur}
              </ContactItem>
              {etudiant.telephoneEtudiant && (
                <ContactItem>
                  <Phone size={13} strokeWidth={2} />
                  {etudiant.telephoneEtudiant}
                </ContactItem>
              )}
              {etudiant.adresse && (
                <ContactItem>
                  <MapPin size={13} strokeWidth={2} />
                  {etudiant.adresse}
                </ContactItem>
              )}
            </ContactBar>

            {estMonProfil ? (
              <BannerEditButton onClick={handleModifier}>
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

        {/* === Bannière : stage en cours === */}
        {stageRecrute && (
          <StageBanner>
            <StageIcon>
              <PartyPopper size={32} strokeWidth={1.8} />
            </StageIcon>
            <StageContent>
              <StageTitle>
                {estMonProfil ? 'Votre stage en cours' : 'Stage en cours de recrutement'}
              </StageTitle>
              <StageDetails>
                Poste <strong>{stageRecrute.posteOffre}</strong> chez{' '}
                <strong>{stageRecrute.nomEntreprise}</strong>
                {stageRecrute.duree && <> • Durée : {stageRecrute.duree}</>}
                {stageRecrute.typeStage && <> • {stageRecrute.typeStage}</>}
                {stageRecrute.dateDebut && <> • Début : {formatDate(stageRecrute.dateDebut)}</>}
              </StageDetails>
            </StageContent>
          </StageBanner>
        )}

        {/* === Bio === */}
        {etudiant.bio ? (
          <Section>
            <SectionTitle>
              <BookOpen size={16} strokeWidth={2} />
              À propos
            </SectionTitle>
            <BioText>{etudiant.bio}</BioText>
          </Section>
        ) : estMonProfil && (
          <Section>
            <SectionTitle>
              <BookOpen size={16} strokeWidth={2} />
              À propos
            </SectionTitle>
            <EmptyState>
              Vous n'avez pas encore renseigné votre bio.{' '}
              <EmptyStateLink onClick={handleModifier}>
                Ajouter une bio
                <ArrowRight size={12} strokeWidth={2.5} />
              </EmptyStateLink>
            </EmptyState>
          </Section>
        )}

        {/* === Compétences === */}
        {competences.length > 0 ? (
          <Section>
            <SectionTitle>
              <Sparkles size={16} strokeWidth={2} />
              Compétences
            </SectionTitle>
            <SkillList>
              {competences.map(c => (
                <SkillChip key={c.idCompetenceEtudiant}>
                  {c.nomCompetenceReference}
                  {c.niveau && <small>· {c.niveau}</small>}
                </SkillChip>
              ))}
            </SkillList>
          </Section>
        ) : estMonProfil && (
          <Section>
            <SectionTitle>
              <Sparkles size={16} strokeWidth={2} />
              Compétences
            </SectionTitle>
            <EmptyState>
              Vous n&apos;avez pas encore de compétence déclarée.{' '}
              <EmptyStateLink onClick={handleModifier}>
                Ajouter une compétence
                <ArrowRight size={12} strokeWidth={2.5} />
              </EmptyStateLink>
              {' '}— ou confirmez celles détectées depuis{' '}
              <EmptyStateLink onClick={() => router.push('/pages/etudiantCV')}>
                Mes CV
                <ArrowRight size={12} strokeWidth={2.5} />
              </EmptyStateLink>
            </EmptyState>
          </Section>
        )}

        {/* === Documents === */}
        {cv && (
          <Section>
            <SectionTitle>
              <FileText size={16} strokeWidth={2} />
              Documents
            </SectionTitle>
            <DocumentList>
              <DocumentLink onClick={handleOuvrirCv}>
                <FileText size={14} strokeWidth={2} />
                {cv.nomFichierOriginal || cv.libelle || 'Voir le CV'}
              </DocumentLink>
            </DocumentList>
          </Section>
        )}

        {/* === Grille : preferences a gauche | academique + interets a droite === */}
        <ContentGrid>
          {preferenceStage && (
            <Section>
              <SectionTitle>
                <Target size={16} strokeWidth={2} />
                Préférences de stage
              </SectionTitle>
              <InfoList>
                {preferenceStage.villePreferee && (
                  <InfoItem>
                    <InfoLabel>Ville préférée</InfoLabel>
                    <InfoValue>{preferenceStage.villePreferee}</InfoValue>
                  </InfoItem>
                )}
                {preferenceStage.typeStagePreferee && (
                  <InfoItem>
                    <InfoLabel>Type de stage</InfoLabel>
                    <InfoValue>{preferenceStage.typeStagePreferee}</InfoValue>
                  </InfoItem>
                )}
                {preferenceStage.typeEntreprisePreferee && (
                  <InfoItem>
                    <InfoLabel>Type d'entreprise</InfoLabel>
                    <InfoValue>{preferenceStage.typeEntreprisePreferee}</InfoValue>
                  </InfoItem>
                )}
                {preferenceStage.dureeSouhaitee && (
                  <InfoItem>
                    <InfoLabel>Durée souhaitée</InfoLabel>
                    <InfoValue>{preferenceStage.dureeSouhaitee}</InfoValue>
                  </InfoItem>
                )}
                {preferenceStage.accepteTeletravail && (
                  <InfoItem>
                    <InfoLabel>Télétravail</InfoLabel>
                    <InfoValue>{preferenceStage.accepteTeletravail}</InfoValue>
                  </InfoItem>
                )}
                <InfoItem>
                  <InfoLabel>Mobilité nationale</InfoLabel>
                  <InfoValue>{formatBoolean(preferenceStage.mobiliteNational)}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Disponibilité immédiate</InfoLabel>
                  <InfoValue>{formatBoolean(preferenceStage.disponibiliteImmediate)}</InfoValue>
                </InfoItem>
                {preferenceStage.dateDebutDisponibilite && (
                  <InfoItem>
                    <InfoLabel>Disponible du</InfoLabel>
                    <InfoValue>
                      {formatDate(preferenceStage.dateDebutDisponibilite)}
                      {preferenceStage.dateFinDisponibilite && ` au ${formatDate(preferenceStage.dateFinDisponibilite)}`}
                    </InfoValue>
                  </InfoItem>
                )}
              </InfoList>
            </Section>
          )}

          <GridColumn>
            <Section>
              <SectionTitle>
                <GraduationCap size={16} strokeWidth={2} />
                Informations académiques
              </SectionTitle>
              <InfoList>
                {etudiant.nomUniversite && (
                  <InfoItem>
                    <InfoLabel>Université</InfoLabel>
                    <InfoValue>
                      {etudiant.nomUniversite}
                      {etudiant.sigleUniversitaire && ` (${etudiant.sigleUniversitaire})`}
                    </InfoValue>
                  </InfoItem>
                )}
                {etudiant.niveauAcademique && (
                  <InfoItem>
                    <InfoLabel>Niveau</InfoLabel>
                    <InfoValue>{etudiant.niveauAcademique}</InfoValue>
                  </InfoItem>
                )}
                {etudiant.filiere && (
                  <InfoItem>
                    <InfoLabel>Filière</InfoLabel>
                    <InfoValue>{etudiant.filiere}</InfoValue>
                  </InfoItem>
                )}
                {etudiant.specialisation && (
                  <InfoItem>
                    <InfoLabel>Spécialisation</InfoLabel>
                    <InfoValue>{etudiant.specialisation}</InfoValue>
                  </InfoItem>
                )}
                {etudiant.matricule && (
                  <InfoItem>
                    <InfoLabel>Matricule</InfoLabel>
                    <InfoValue>{etudiant.matricule}</InfoValue>
                  </InfoItem>
                )}
                {etudiant.genre && (
                  <InfoItem>
                    <InfoLabel>Genre</InfoLabel>
                    <InfoValue>{etudiant.genre}</InfoValue>
                  </InfoItem>
                )}
              </InfoList>
            </Section>

            {/* Centres d'interet : juste sous les informations academiques */}
            <Section>
              <SectionTitle>
                <Heart size={16} strokeWidth={2} />
                Centres d'intérêt
              </SectionTitle>
              {centresInteret.length === 0 ? (
                <EmptyState>
                  {estMonProfil ? (
                    <>
                      Vous n'avez pas encore ajouté de centre d'intérêt.{' '}
                      <EmptyStateLink onClick={handleModifier}>
                        Ajouter un centre d'intérêt
                        <ArrowRight size={12} strokeWidth={2.5} />
                      </EmptyStateLink>
                    </>
                  ) : (
                    "Aucun centre d'intérêt ajouté."
                  )}
                </EmptyState>
              ) : (
                <InterestList>
                  {centresInteret.map((c, idx) => (
                    <InterestItem key={idx}>
                      <InterestDomaine>{c.domaineInteret}</InterestDomaine>
                      <InterestMission>
                        {c.missionPreferee || 'Aucune mission précisée'}
                      </InterestMission>
                    </InterestItem>
                  ))}
                </InterestList>
              )}
            </Section>
          </GridColumn>
        </ContentGrid>

        {/* === Parcours / Réalisations : pleine largeur === */}
        <Section>
          <SectionTitle>
            <Briefcase size={16} strokeWidth={2} />
            Parcours et réalisations
          </SectionTitle>
          {parcours.length === 0 ? (
            <EmptyState>
              {estMonProfil ? (
                <>
                  Vous n'avez pas encore ajouté de parcours.{' '}
                  <EmptyStateLink onClick={handleModifier}>
                    Ajouter un parcours
                    <ArrowRight size={12} strokeWidth={2.5} />
                  </EmptyStateLink>
                </>
              ) : (
                'Aucun parcours ajouté.'
              )}
            </EmptyState>
          ) : (
            <ParcoursList>
              {parcours.map((p, idx) => (
                <ParcoursCard key={p.idParcoursRealisation || p.idParcours || idx}>
                  <ParcoursTitle>{p.titre}</ParcoursTitle>
                  <ParcoursDetails>
                    {p.type && (
                      <ParcoursRow>
                        <ParcoursRowLabel>Type</ParcoursRowLabel>
                        <ParcoursRowValue>{p.type}</ParcoursRowValue>
                      </ParcoursRow>
                    )}
                    {p.entreprise && (
                      <ParcoursRow>
                        <ParcoursRowLabel>Entreprise</ParcoursRowLabel>
                        <ParcoursRowValue>{p.entreprise}</ParcoursRowValue>
                      </ParcoursRow>
                    )}
                    {p.dateDebut && (
                      <ParcoursRow>
                        <ParcoursRowLabel>Période</ParcoursRowLabel>
                        <ParcoursRowValue>
                          {formatDate(p.dateDebut)}
                          {p.dateFin ? ` — ${formatDate(p.dateFin)}` : ' — en cours'}
                        </ParcoursRowValue>
                      </ParcoursRow>
                    )}
                    {p.description && (
                      <ParcoursRow>
                        <ParcoursRowLabel>Description</ParcoursRowLabel>
                        <ParcoursRowValue>{p.description}</ParcoursRowValue>
                      </ParcoursRow>
                    )}
                    {p.lien && (
                      <ParcoursRow>
                        <ParcoursRowLabel>Lien</ParcoursRowLabel>
                        <ParcoursRowValue>
                          <ParcoursLink href={p.lien} target="_blank" rel="noopener noreferrer">
                            <ExternalLink size={12} strokeWidth={2} />
                            {p.lien}
                          </ParcoursLink>
                        </ParcoursRowValue>
                      </ParcoursRow>
                    )}
                  </ParcoursDetails>
                </ParcoursCard>
              ))}
            </ParcoursList>
          )}
        </Section>
      </PageContainer>
    </>
  )
}