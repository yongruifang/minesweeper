// import { useI18n } from 'vue-i18n'
// export default new useI18n({
//     legacy: false,
//     locale: 'zh-CN',
//     fallbackLocale: 'zh-CN',
//     messages: {
//         'en': './locales/en.json',
//         'zh-CN': './locales/zh-CN.json',
//         'zh-TW': './locales/zh-TW.json'
//     }
// })

import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN.json'
import en from './locales/en.json'
import zhTW from './locales/zh-TW.json'
// Type-define 'en-US' as the master schema for the resource
type MessageSchema = typeof zhCN
export const i18n = createI18n<[MessageSchema], 'zh-CN' | 'en' | 'zh-TW'>({
    legacy: false,
    locale: 'zh-CN',
    messages: {
        'en': en,
        'zh-CN': zhCN,
        'zh-TW': zhTW,
    }
})
