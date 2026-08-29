'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAuth } from '@/lib/auth'
import AppNavbar from '@/components/appNavbar'
import {
  Megaphone, Plus, Calendar, GraduationCap, BookMarked, Clock,
  CalendarClock, Users, Eye, Pencil, Trash2, X, FileText, Target,
  ClipboardList, Mail, Download, AlertTriangle, AlertCircle
} from 'lucide-react'
import {
  PageContainer, HeaderSection, PageTitle, PageSubtitle,
  CreateButton,
  AnnoncesGrid, AnnonceCard, AnnonceHeader, AnnonceTitle, StatutBadge,
  AnnonceMeta, MetaItem, EtudiantsCount,
  AnnonceActions, VoirButton, ModifierButton, SupprimerButton,
  EmptyState, EmptyTitle, EmptyText,
  LoadingState, ErrorMessage, ErrorIcon,
  ConfirmPopup, ConfirmBox, ConfirmIcon, ConfirmTitle, ConfirmText, ConfirmButtons,
  ConfirmCancelButton, ConfirmDeleteButton,
  DetailOverlay, DetailModal, DetailHeader, DetailTitle, DetailClose, DetailBody,
  DetailSection, DetailSectionTitle,
  DetailGrid, DetailField, DetailLabel, DetailValue,
  DetailDescription,
  EtudiantsListModal, EtudiantRow, EtudiantInfoModal, EtudiantNomComplet, EtudiantEmail,
  EtudiantCvAction, EtudiantSansCv
} from '@/components/styleUniversiteCohortes'

export default function UniversiteCohortesPage() {
  const router = useRouter()
  const [annonces, setAnnonces] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [detailData, setDetailData] = useState(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  useEffect(() => {
    const fetchAnnonces = async () => {
      try {
        const res = await fetchAuth('/api/universiteCohortes')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur de chargement')
        setAnnonces(data.annonces || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAnnonces()
  }, [])

  /* Ces deux chemins doivent correspondre EXACTEMENT aux dossiers :
     app/pages/universiteCohortes/nouveau/page.js
     app/pages/universiteCohortes/[idAnnonce]/page.js               */
  const handleCreer = () => router.push('/pages/universiteCohortes/nouveau')
  const handleModifier = (idAnnonce) =>
    router.push(`/pages/universiteCohortes/${idAnnonce}`)

  const ouvrirDetail = async (idAnnonce) => {
    setIsLoadingDetail(true)
    setDetailData({ loading: true })
    try {
      const res = await fetchAuth(`/api/universiteCohortes/${idAnnonce}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur de chargement')
      setDetailData({ annonce: data.annonce, etudiants: data.etudiants })
    } catch (err) {
      setError(err.message)
      setDetailData(null)
    } finally {
      setIsLoadingDetail(false)
    }
  }

  const fermerDetail = () => setDetailData(null)


  const confirmerSupprimer = async () => {
    if (!deleteConfirmId) return
    setIsDeleting(true)
    try {
      const res = await fetchAuth(`/api/universiteCohortes/${deleteConfirmId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur suppression')
      setAnnonces(prev => prev.filter(a => a.idAnnonceCohorte !== deleteConfirmId))
      setDeleteConfirmId(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
    })
  }

  const annonceASupprimer = useMemo(
    () => annonces.find(a => a.idAnnonceCohorte === deleteConfirmId),
    [annonces, deleteConfirmId]
  )

  if (isLoading) {
    return (
      <>
        <AppNavbar />
        <PageContainer><LoadingState>Chargement de vos annonces...</LoadingState></PageContainer>
      </>
    )
  }

  return (
    <>
      <AppNavbar />
      <PageContainer>
        <HeaderSection>
          <div>
            <PageTitle>
              <Megaphone size={26} strokeWidth={2} />
              Mes annonces de cohorte
            </PageTitle>
            <PageSubtitle>
              Gérez les annonces publiées pour vos étudiants en recherche de stage.
            </PageSubtitle>
          </div>
          <CreateButton onClick={handleCreer}>
            <Plus size={16} strokeWidth={2.5} />
            Nouvelle annonce
          </CreateButton>
        </HeaderSection>

        {error && (
          <ErrorMessage>
            <ErrorIcon><AlertCircle size={16} strokeWidth={2} /></ErrorIcon>
            {error}
          </ErrorMessage>
        )}

        {annonces.length === 0 ? (
          <EmptyState>
            <Megaphone size={44} strokeWidth={1.6} />
            <EmptyTitle>Aucune annonce publiée pour l'instant</EmptyTitle>
            <EmptyText>
              Créez votre première annonce pour proposer vos étudiants
              en stage aux entreprises de la plateforme.
            </EmptyText>
            <CreateButton onClick={handleCreer}>
              <Plus size={16} strokeWidth={2.5} />
              Créer ma première annonce
            </CreateButton>
          </EmptyState>
        ) : (
          <AnnoncesGrid>
            {annonces.map(a => (
              <AnnonceCard key={a.idAnnonceCohorte}>
                <AnnonceHeader>
                  <AnnonceTitle>{a.titre}</AnnonceTitle>
                  <StatutBadge $statut={a.statut}>{a.statut}</StatutBadge>
                </AnnonceHeader>

                <AnnonceMeta>
                  <MetaItem>
                    <Calendar size={13} strokeWidth={2} />
                    Publiée le {formatDate(a.datePublication)}
                  </MetaItem>
                  {a.niveauAcademique && (
                    <MetaItem>
                      <GraduationCap size={13} strokeWidth={2} />
                      {a.niveauAcademique}
                    </MetaItem>
                  )}
                  {a.filiereConcernee && (
                    <MetaItem>
                      <BookMarked size={13} strokeWidth={2} />
                      {a.filiereConcernee}
                    </MetaItem>
                  )}
                  {a.dureeStage && (
                    <MetaItem>
                      <Clock size={13} strokeWidth={2} />
                      {a.dureeStage}
                    </MetaItem>
                  )}
                  {a.dateLimite && (
                    <MetaItem>
                      <CalendarClock size={13} strokeWidth={2} />
                      Limite : {formatDate(a.dateLimite)}
                    </MetaItem>
                  )}
                </AnnonceMeta>

                <EtudiantsCount>
                  <Users size={13} strokeWidth={2.5} />
                  {a.nombreEtudiants || 0} étudiant{a.nombreEtudiants > 1 ? 's' : ''} rattaché
                  {a.nombreEtudiants > 1 ? 's' : ''}
                </EtudiantsCount>

                <AnnonceActions>
                  <VoirButton
                    onClick={() => ouvrirDetail(a.idAnnonceCohorte)}
                    disabled={isLoadingDetail}
                  >
                    <Eye size={13} strokeWidth={2} />
                    Voir
                  </VoirButton>
                  <ModifierButton onClick={() => handleModifier(a.idAnnonceCohorte)}>
                    <Pencil size={13} strokeWidth={2} />
                    Modifier
                  </ModifierButton>
                  <SupprimerButton onClick={() => setDeleteConfirmId(a.idAnnonceCohorte)}>
                    <Trash2 size={13} strokeWidth={2} />
                    Supprimer
                  </SupprimerButton>
                </AnnonceActions>
              </AnnonceCard>
            ))}
          </AnnoncesGrid>
        )}

        {/* ==================== POPUP CONFIRMATION SUPPRESSION ==================== */}
        {deleteConfirmId && (
          <ConfirmPopup onClick={() => !isDeleting && setDeleteConfirmId(null)}>
            <ConfirmBox onClick={(e) => e.stopPropagation()}>
              <ConfirmIcon>
                <AlertTriangle size={32} strokeWidth={2} />
              </ConfirmIcon>
              <ConfirmTitle>Supprimer cette annonce ?</ConfirmTitle>
              <ConfirmText>
                Vous êtes sur le point de supprimer l'annonce
                {annonceASupprimer && <> « <strong>{annonceASupprimer.titre}</strong> »</>}.
                <br />
                Tous les étudiants qui y étaient rattachés seront également retirés.
                <br />
                <strong>Cette action est irréversible.</strong>
              </ConfirmText>
              <ConfirmButtons>
                <ConfirmCancelButton
                  onClick={() => setDeleteConfirmId(null)}
                  disabled={isDeleting}
                >
                  Annuler
                </ConfirmCancelButton>
                <ConfirmDeleteButton onClick={confirmerSupprimer} disabled={isDeleting}>
                  {isDeleting ? 'Suppression...' : (
                    <>
                      <Trash2 size={14} strokeWidth={2} />
                      Oui, supprimer
                    </>
                  )}
                </ConfirmDeleteButton>
              </ConfirmButtons>
            </ConfirmBox>
          </ConfirmPopup>
        )}

        {/* ==================== MODAL DÉTAIL ANNONCE ==================== */}
        {detailData && (
          <DetailOverlay onClick={fermerDetail}>
            <DetailModal onClick={(e) => e.stopPropagation()}>
              <DetailHeader>
                <DetailTitle>
                  {detailData.loading
                    ? 'Chargement...'
                    : detailData.annonce?.titre}
                </DetailTitle>
                <DetailClose onClick={fermerDetail} aria-label="Fermer">
                  <X size={16} strokeWidth={2.5} />
                </DetailClose>
              </DetailHeader>

              <DetailBody>
                {detailData.loading ? (
                  <LoadingState>Chargement...</LoadingState>
                ) : (
                  <>
                    {detailData.annonce?.description && (
                      <DetailSection>
                        <DetailSectionTitle>
                          <FileText size={14} strokeWidth={2} />
                          Description
                        </DetailSectionTitle>
                        <DetailDescription>
                          {detailData.annonce.description}
                        </DetailDescription>
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
                          <DetailValue>
                            {detailData.annonce?.filiereConcernee || '—'}
                          </DetailValue>
                        </DetailField>
                        <DetailField>
                          <DetailLabel>Niveau académique</DetailLabel>
                          <DetailValue>
                            {detailData.annonce?.niveauAcademique || '—'}
                          </DetailValue>
                        </DetailField>
                        <DetailField>
                          <DetailLabel>Domaines de recherche</DetailLabel>
                          <DetailValue>
                            {detailData.annonce?.domainesRecherche || '—'}
                          </DetailValue>
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
                            {detailData.annonce?.periodeDebut && detailData.annonce?.periodeFin
                              ? `Du ${formatDate(detailData.annonce.periodeDebut)} au ${formatDate(detailData.annonce.periodeFin)}`
                              : '—'}
                          </DetailValue>
                        </DetailField>
                        <DetailField>
                          <DetailLabel>Durée</DetailLabel>
                          <DetailValue>
                            {detailData.annonce?.dureeStage || '—'}
                          </DetailValue>
                        </DetailField>
                        <DetailField>
                          <DetailLabel>Ville préférée</DetailLabel>
                          <DetailValue>
                            {detailData.annonce?.villePreferee || '—'}
                          </DetailValue>
                        </DetailField>
                        <DetailField>
                          <DetailLabel>Télétravail</DetailLabel>
                          <DetailValue>
                            {detailData.annonce?.accepteTeletravail || 'Indifférent'}
                          </DetailValue>
                        </DetailField>
                        <DetailField>
                          <DetailLabel>Date limite</DetailLabel>
                          <DetailValue>
                            {formatDate(detailData.annonce?.dateLimite)}
                          </DetailValue>
                        </DetailField>
                        <DetailField>
                          <DetailLabel>Statut</DetailLabel>
                          <DetailValue>
                            {detailData.annonce?.statut || '—'}
                          </DetailValue>
                        </DetailField>
                      </DetailGrid>
                    </DetailSection>

                    <DetailSection>
                      <DetailSectionTitle>
                        <Users size={14} strokeWidth={2} />
                        Étudiants concernés ({detailData.etudiants?.length || 0})
                      </DetailSectionTitle>

                      {(!detailData.etudiants || detailData.etudiants.length === 0) ? (
                        <EmptyText>Aucun étudiant rattaché à cette annonce.</EmptyText>
                      ) : (
                        <EtudiantsListModal>
                          {detailData.etudiants.map((e, idx) => (
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
                              {e.aUnCV === false && <EtudiantSansCv>— Pas encore de CV —</EtudiantSansCv>}
                            </EtudiantRow>
                          ))}
                        </EtudiantsListModal>
                      )}
                    </DetailSection>
                  </>
                )}
              </DetailBody>
            </DetailModal>
          </DetailOverlay>
        )}
      </PageContainer>
    </>
  )
}