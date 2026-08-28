'use client'
import { useEffect } from 'react'
import {
  X, MapPin, Briefcase, FileText, Target, Calendar,
  Wallet, Building, Wrench, Pencil, ArrowRight
} from 'lucide-react'
import {
  ModalBackdrop, ModalContainer, CloseButton, ModalHeader,
  ModalLogo, ModalCompanyInfo, ModalCompanyName, ModalSubtitle,
  ModalBody, ModalTitle,
  SectionTitle, SectionContent, DateGrid, DateItem, DateLabel, DateValue,
  CompetencesList, CompetenceBadge, ObligatoireDot,
  ModalFooter, PostulerButton, CancelButton, ModifierButton
} from '@/components/styleOffreModal'

export default function OffreModal({ offre, onClose, onPostuler, onModifier }) {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [onClose])

  const formatDate = (date) => {
    if (!date) return 'Non spécifiée'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
    })
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <ModalBackdrop onClick={handleBackdropClick}>
      <ModalContainer>
        <CloseButton onClick={onClose} aria-label="Fermer">
          <X size={16} strokeWidth={2.5} />
        </CloseButton>

        <ModalHeader>
          <ModalLogo>
            {offre.logoEntreprise ? (
              <img src={offre.logoEntreprise} alt={offre.nomEntreprise} />
            ) : (
              offre.nomEntreprise?.charAt(0).toUpperCase()
            )}
          </ModalLogo>
          <ModalCompanyInfo>
            <ModalCompanyName>{offre.nomEntreprise}</ModalCompanyName>
            <ModalSubtitle>
              <MapPin size={13} strokeWidth={2} />
              {offre.ville || 'Lieu non spécifié'}
            </ModalSubtitle>
          </ModalCompanyInfo>
        </ModalHeader>

        <ModalBody>
          <ModalTitle>{offre.titre}</ModalTitle>

          {/* === RESUME : chaque valeur porte desormais son libelle === */}
          <DateGrid>
            {offre.typeStage && (
              <DateItem>
                <DateLabel>Type de stage</DateLabel>
                <DateValue>{offre.typeStage}</DateValue>
              </DateItem>
            )}
            {offre.niveauRequis && (
              <DateItem>
                <DateLabel>Niveau requis</DateLabel>
                <DateValue>{offre.niveauRequis}</DateValue>
              </DateItem>
            )}
            {offre.duree && (
              <DateItem>
                <DateLabel>Durée du stage</DateLabel>
                <DateValue>{offre.duree}</DateValue>
              </DateItem>
            )}
            {offre.accepteTeletravail && (
              <DateItem>
                <DateLabel>Mode de travail</DateLabel>
                <DateValue>{offre.accepteTeletravail}</DateValue>
              </DateItem>
            )}
            {offre.domaine && (
              <DateItem>
                <DateLabel>Domaine</DateLabel>
                <DateValue>{offre.domaine}</DateValue>
              </DateItem>
            )}
            {offre.remuneration && (
              <DateItem>
                <DateLabel>Rémunération</DateLabel>
                <DateValue>{offre.remuneration}</DateValue>
              </DateItem>
            )}
          </DateGrid>

          {offre.description && (
            <>
              <SectionTitle>
                <FileText size={13} strokeWidth={2} />
                Description
              </SectionTitle>
              <SectionContent>{offre.description}</SectionContent>
            </>
          )}

          <SectionTitle>
            <Calendar size={13} strokeWidth={2} />
            Dates importantes
          </SectionTitle>
          <DateGrid>
            <DateItem>
              <DateLabel>Date de début</DateLabel>
              <DateValue>{formatDate(offre.dateDebut)}</DateValue>
            </DateItem>
            <DateItem>
              <DateLabel>Date de fin</DateLabel>
              <DateValue>{formatDate(offre.dateFin)}</DateValue>
            </DateItem>
            <DateItem>
              <DateLabel>Limite candidature</DateLabel>
              <DateValue>{formatDate(offre.dateLimites)}</DateValue>
            </DateItem>
            <DateItem>
              <DateLabel>Publiée le</DateLabel>
              <DateValue>{formatDate(offre.datePublication)}</DateValue>
            </DateItem>
          </DateGrid>

          {offre.lieu && (
            <>
              <SectionTitle>
                <Building size={13} strokeWidth={2} />
                Adresse
              </SectionTitle>
              <SectionContent>{offre.lieu}</SectionContent>
            </>
          )}

          {offre.competences && offre.competences.length > 0 && (
            <>
              <SectionTitle>
                <Wrench size={13} strokeWidth={2} />
                Compétences requises
              </SectionTitle>
              <CompetencesList>
                {offre.competences.map((comp, idx) => (
                  <CompetenceBadge key={idx} $obligatoire={comp.estObligatoire}>
                    {comp.estObligatoire && <ObligatoireDot />}
                    {comp.nom}
                    {comp.niveauSouhaitee && (
                      <span style={{ opacity: 0.7, fontSize: '11px', marginLeft: '6px' }}>
                        ({comp.niveauSouhaitee})
                      </span>
                    )}
                  </CompetenceBadge>
                ))}
              </CompetencesList>
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <CancelButton onClick={onClose}>Fermer</CancelButton>

          {onPostuler && offre.dejaPostule && (
            <PostulerButton as="span" style={{ opacity: 0.6, cursor: 'default' }}>
              Vous avez déjà postulé à cette offre
            </PostulerButton>
          )}
          {onPostuler && !offre.dejaPostule && (
            <PostulerButton onClick={() => onPostuler(offre)}>
              Postuler à cette offre
              <ArrowRight size={15} strokeWidth={2.5} />
            </PostulerButton>
          )}
          {onModifier && (
            <ModifierButton onClick={() => onModifier(offre)}>
              <Pencil size={14} strokeWidth={2} />
              Modifier l'offre
            </ModifierButton>
          )}
        </ModalFooter>
      </ModalContainer>
    </ModalBackdrop>
  )
}