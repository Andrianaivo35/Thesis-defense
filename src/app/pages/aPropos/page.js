'use client'
import { useRouter } from 'next/navigation'
import AppNavbar from '@/components/appNavbar'
import {
  Info, GraduationCap, Building2, Landmark, Target, ShieldCheck, ArrowLeft
} from 'lucide-react'
import {
  PageContainer, PageHeader, PageTitle, PageSubtitle,
  CandidatureList, CandidatureCard, CardHeader,
  OffreTitre, EntrepriseNom, CardMeta, MetaItem,
  CardFooter, ActionButton
} from '@/components/styleEtudiantCandidature'

/* Le pied de page de l'accueil pointait vers cette page, qui n'existait
   pas : le lien renvoyait une erreur 404. */

const PROFILS = [
  {
    Icone: GraduationCap,
    titre: 'Étudiants',
    resume: 'Trouver un stage qui correspond réellement à son profil',
    details: [
      'Constituez votre profil : compétences, parcours, préférences de stage.',
      'Recevez des recommandations d’offres classées selon votre profil.',
      'Conservez plusieurs CV et choisissez le plus adapté au moment de postuler.',
      'Suivez l’avancement de chacune de vos candidatures.'
    ]
  },
  {
    Icone: Building2,
    titre: 'Entreprises',
    resume: 'Recruter des stagiaires dont les compétences correspondent au poste',
    details: [
      'Publiez vos offres en précisant les compétences attendues.',
      'Évaluez les candidats grâce à un questionnaire de présélection.',
      'Consultez les dossiers reçus et suivez vos décisions de recrutement.',
      'Recherchez directement des candidats selon leur profil.'
    ]
  },
  {
    Icone: Landmark,
    titre: 'Universités',
    resume: 'Accompagner ses étudiants vers l’insertion professionnelle',
    details: [
      'Validez le rattachement de vos étudiants à votre établissement.',
      'Publiez des annonces de cohorte pour présenter une promotion entière.',
      'Suivez le placement de vos étudiants et leurs candidatures.'
    ]
  }
]

export default function APropos() {
  const router = useRouter()

  return (
    <>
      <AppNavbar />
      <PageContainer>
        <PageHeader>
          <PageTitle>
            <Info size={24} strokeWidth={2} />
            À propos de Stage Share
          </PageTitle>
          <PageSubtitle>
            Une plateforme de mise en relation entre les étudiants à la recherche
            d&apos;un stage, les entreprises qui recrutent, et les établissements
            d&apos;enseignement supérieur qui les accompagnent.
          </PageSubtitle>
        </PageHeader>

        <CandidatureCard style={{ marginBottom: 24 }}>
          <CardHeader>
            <div>
              <OffreTitre>Notre objectif</OffreTitre>
              <EntrepriseNom>
                <Target size={14} strokeWidth={2} />
                Rapprocher les profils et les offres, pas seulement les publier
              </EntrepriseNom>
            </div>
          </CardHeader>
          <CardMeta>
            <MetaItem style={{ display: 'block', lineHeight: 1.7 }}>
              La recherche de stage se heurte souvent au même obstacle : les offres
              existent, les candidats aussi, mais ils se trouvent mal. Stage Share
              analyse les compétences déclarées, le niveau d&apos;études, la filière et
              les préférences de chacun pour proposer à l&apos;étudiant les offres qui
              lui correspondent vraiment — et expliquer pourquoi.
            </MetaItem>
          </CardMeta>
        </CandidatureCard>

        <PageTitle style={{ fontSize: 19 }}>Pour qui ?</PageTitle>

        <CandidatureList style={{ marginBottom: 24 }}>
          {PROFILS.map(({ Icone, titre, resume, details }) => (
            <CandidatureCard key={titre}>
              <CardHeader>
                <div>
                  <OffreTitre>{titre}</OffreTitre>
                  <EntrepriseNom>
                    <Icone size={14} strokeWidth={2} />
                    {resume}
                  </EntrepriseNom>
                </div>
              </CardHeader>
              <CardMeta style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                {details.map(d => (
                  <MetaItem key={d} style={{ lineHeight: 1.6 }}>• {d}</MetaItem>
                ))}
              </CardMeta>
            </CandidatureCard>
          ))}
        </CandidatureList>

        <CandidatureCard>
          <CardHeader>
            <div>
              <OffreTitre>Vos données</OffreTitre>
              <EntrepriseNom>
                <ShieldCheck size={14} strokeWidth={2} />
                Accès restreint aux documents personnels
              </EntrepriseNom>
            </div>
          </CardHeader>
          <CardMeta>
            <MetaItem style={{ display: 'block', lineHeight: 1.7 }}>
              Les CV et lettres de motivation ne sont accessibles qu&apos;à leur
              propriétaire, aux entreprises destinataires d&apos;une candidature, et à
              l&apos;université de rattachement de l&apos;étudiant. Les comptes
              entreprises et universités sont vérifiés par notre équipe avant
              d&apos;obtenir le badge correspondant.
            </MetaItem>
          </CardMeta>
          <CardFooter>
            <span />
            <ActionButton onClick={() => router.push('/')}>
              <ArrowLeft size={13} strokeWidth={2} />
              Retour à l&apos;accueil
            </ActionButton>
          </CardFooter>
        </CandidatureCard>
      </PageContainer>
    </>
  )
}
