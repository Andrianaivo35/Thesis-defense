'use client'
import { useState } from "react"
import { fetchAuth } from '@/lib/auth'
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

export default function AdminRegistreInfo(){
    const [nomAdmin, setNomAdmin] = useState('');
    const [prenomAdmin, setPrenomAdmin] = useState('');
    const [emailAdmin, setEmailAdmin] = useState('');
    const [telephone, setTelephone] = useState('');
    const [motDePasse, setMotDePasse] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async(e) => {
        e.preventDefault()
        setMessage('')
        try{
            const res = await fetchAuth('/api/adminRegistreInfo', {
                method: 'POST',
                headers: {'Content-type': 'application/json'},
                body: JSON.stringify({
                    nomAdmin,
                    prenomAdmin,
                    emailAdmin,
                    telephone,
                    motDePasse
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || `Erreur ${res.status}`);
            }

            setMessage('✅ Compte admin créé avec succès !')
            // Réinitialiser le formulaire
            setNomAdmin('')
            setPrenomAdmin('')
            setEmailAdmin('')
            setTelephone('')
            setMotDePasse('')
        }catch(error){
            console.log('Erreur: ', error)
            setMessage('❌ ' + error.message)
        }
    }

return(
    <PageContainer>
        <ContainerForm>
            <ContainerTexte>
                <h2>Création d'un compte administrateur</h2>
            </ContainerTexte>

            <form onSubmit={handleSubmit}>
                <FormGrid>
                    <ColumnForm>
                        <ContainerLabelInput>
                            <Label>Nom</Label>
                            <Input
                                type="text"
                                value={nomAdmin}
                                onChange={(e) => setNomAdmin(e.target.value)}
                                placeholder="Ex: Andrianaivo"
                            />
                        </ContainerLabelInput>
                        <ContainerLabelInput>
                            <Label>Prénom</Label>
                            <Input
                                type="text"
                                value={prenomAdmin}
                                onChange={(e) => setPrenomAdmin(e.target.value)}
                                placeholder="Ex: Fanomezantsoa"
                            />
                        </ContainerLabelInput>
                        <ContainerLabelInput>
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={emailAdmin}
                                onChange={(e) => setEmailAdmin(e.target.value)}
                                placeholder="Ex: admin@stage-share.com"
                            />
                        </ContainerLabelInput>
                    </ColumnForm>

                    <ColumnForm>
                        <ContainerLabelInput>
                            <Label>Téléphone</Label>
                            <Input
                                type="text"
                                value={telephone}
                                onChange={(e) => setTelephone(e.target.value)}
                                placeholder="Ex: 034 00 000 00"
                            />
                        </ContainerLabelInput>
                        <ContainerLabelInput>
                            <Label>Mot de passe</Label>
                            <Input
                                type="password"
                                value={motDePasse}
                                onChange={(e) => setMotDePasse(e.target.value)}
                                placeholder="Ex: Mot de passe"
                            />
                        </ContainerLabelInput>

                        {message && (
                            <p style={{
                                margin: '8px 0',
                                fontWeight: 600,
                                color: message.startsWith('✅') ? '#059669' : '#dc2626'
                            }}>
                                {message}
                            </p>
                        )}

                        <ContainerBoutton>
                            <Boutton type="submit" value="Créer le compte" />
                        </ContainerBoutton>
                    </ColumnForm>
                </FormGrid>
            </form>
        </ContainerForm>
    </PageContainer>
)
}