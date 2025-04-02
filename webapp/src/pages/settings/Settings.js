import React from 'react'
import Nav from '../../components/nav/Nav'
import Footer from '../../components/Footer'
import './Settings.css'
import BaseButton from '../../components/button/BaseButton'
import { useTranslation } from 'react-i18next'

const Settings = () => {
  const {t} = useTranslation();

  return (
    <div className='mainSettingsPageContainer'>
        <Nav/>
        <main>
            <h1>{t("select_category")}</h1>
            <div className='gameCategoriesGrid'>

            </div>
            <div className='gameButtonPanel'>
                <BaseButton text={t("play")}></BaseButton>
            </div>
        </main>
        <Footer/>
    </div>
  )
}

export default Settings