'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAuth } from '@/lib/auth'
import { REGLE_MOT_DE_PASSE } from '@/lib/motDePasse'
import { AlertCircle, CheckCircle2, ArrowLeft, ShieldPlus } from 'lucide-react'
import {
  PageContainer,
  ContainerForm,
  ContainerTexte,
  FormGrid,
  ColumnForm,
  Label,
  Input,
  ContainerLabelInput,
  ContainerBoutton,
  Boutton
} from '@/components/styleEntrepriseRegistreInfo'

/* =====================================================================
   Création d'un compte administrateur

   La page existait mais aucun lien n'y menait, et une fois arrivé on ne
   pouvait plus en sortir : ni barre de navigation, ni retour. Elle est
   désormais atteignable depuis le tableau de bord d'administration, et
   ramène à lui.

   Aucun champ n'était obligatoire : le formulaire partait vide, et
   l'utilisateur découvrait le problème dans la réponse du serveur. La
   règle de mot de passe n'était pas davantage annoncée — on la
   découvrait en étant refusé.
   ===================================================================== */
export default function AdminRegistreInfo() {
  const router = useRouter()

  const [nomAdmin, setNomAdmin] = useState('')
  const [prenomAdmin, setPrenomAdmin] = useState('')
  const [emailAdmin, setEmailAdmin] = useState('')
  const [telephone, setTelephone] = useState('')
  const [motDePasse, setMotDePasse] = useState('')

  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [enCours, setEnCours] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErreur(''); setSucces(''); setEnCours(true)
    try {
      const res = await fetchAuth('/api/adminRegistreInfo', {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ nomAdmin, prenomAdmin, emailAdmin, telephone, motDePasse })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`)

      setSucces(`Le compte de ${prenomAdmin} ${nomAdmin} a été créé. ` +
                `Cette personne peut désormais se connecter avec son adresse.`)
      setNomAdmin(''); setPrenomAdmin(''); setEmailAdmin('')
      setTelephone(''); setMotDePasse('')
    } catch (error) {
      setErreur(error.message)
    } finally {
      setEnCours(false)
    }
  }

  const message = (contenu, estErreur) => (
    <p style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      margin: '10px 0 4px', padding: '11px 13px', borderRadius: 9,
      fontSize: 13.5, lineHeight: 1.5,
      background: estErreur ? '#fef2f2' : '#f0fdf4',
      border: `1px solid ${estErreur ? '#fecaca' : '#bbf7d0'}`,
      color: estErreur ? '#b91c1c' : '#15803d'
    }}>
      {estErreur
        ? <AlertCircle size={16} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
        : <CheckCircle2 size={16} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />}
      {contenu}
    </p>
  )

  return (
    <PageContainer>
      <ContainerForm>
        {/* Le retour au tableau de bord : la page était sans issue. */}
        <button
          type="button"
          onClick={() => router.push('/pages/adminDashboard')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            marginBottom: 18, padding: '8px 13px', fontSize: 13, fontWeight: 600,
            color: '#334155', background: '#ffffff',
            border: '1.5px solid #e2e8f0', borderRadius: 9, cursor: 'pointer'
          }}
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Retour au tableau de bord
        </button>

        <ContainerTexte>
          <h2>
            <ShieldPlus size={20} strokeWidth={2} style={{ verticalAlign: -3, marginRight: 8 }} />
            Création d&apos;un compte administrateur
          </h2>
        </ContainerTexte>

        <form onSubmit={handleSubmit}>
          <FormGrid>
            <ColumnForm>
              <ContainerLabelInput>
                <Label>Nom *</Label>
                <Input
                  type="text" value={nomAdmin} required
                  onChange={(e) => setNomAdmin(e.target.value)}
                  placeholder="Ex : Andrianaivo"
                />
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Prénom *</Label>
                <Input
                  type="text" value={prenomAdmin} required
                  onChange={(e) => setPrenomAdmin(e.target.value)}
                  placeholder="Ex : Fanomezantsoa"
                />
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Adresse électronique *</Label>
                <Input
                  type="email" value={emailAdmin} required autoComplete="off"
                  onChange={(e) => setEmailAdmin(e.target.value)}
                  placeholder="Ex : admin@stageshare.mg"
                />
              </ContainerLabelInput>
            </ColumnForm>

            <ColumnForm>
              <ContainerLabelInput>
                <Label>Téléphone</Label>
                <Input
                  type="tel" value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="Ex : 034 00 000 00"
                />
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Mot de passe *</Label>
                <Input
                  type="password" value={motDePasse} required autoComplete="new-password"
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="••••••••"
                />
                {/* La règle était appliquée par le serveur mais jamais
                    annoncée : on la découvrait en étant refusé. */}
                <p style={{ margin: '6px 0 0', fontSize: 12.5, color: '#94a3b8', lineHeight: 1.5 }}>
                  {REGLE_MOT_DE_PASSE}
                </p>
              </ContainerLabelInput>

              {erreur && message(erreur, true)}
              {succes && message(succes, false)}

              <ContainerBoutton>
                <Boutton
                  type="submit"
                  value={enCours ? 'Création en cours...' : 'Créer le compte'}
                  disabled={enCours}
                />
              </ContainerBoutton>
            </ColumnForm>
          </FormGrid>
        </form>
      </ContainerForm>
    </PageContainer>
  )
}
