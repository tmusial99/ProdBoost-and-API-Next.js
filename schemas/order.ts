import { array, number, object, string, TypeOf } from 'yup';

export const orderFormSchema = object({
    firstName: string().required().min(2, 'Imię musi mieć minimalnie 2 znaki.').max(25, 'Imię musi mieć maksymalnie 25 znaków.'),
    surname: string().required().min(2, 'Nazwisko musi mieć minimalnie 2 znaki.').max(25, 'Nazwisko musi mieć maksymalnie 25 znaków.'),
    address: string().required().min(5, 'Adres musi mieć minimalnie 5 znaków.').max(60, 'Adres musi mieć maksymalnie 60 znaków.'),
    postalCode: string().required().min(4, 'Kod pocztowy musi mieć minimalnie 4 znaków.').max(10, 'Kod pocztowy musi mieć maksymalnie 10 znaków.'),
    city: string().required().min(2, 'Miejscowość musi mieć minimalnie 2 znaki.').max(25, 'Miejscowość musi mieć maksymalnie 25 znaków.'),
    country: string().required().min(1).max(40),
    prefix: string().required().min(2).max(10),
    phoneNumber: string().required().transform((value) => value.replace(/\s*/g, '')).matches(/^\d*$/, 'Niepoprawny numer telefonu.').length(9, 'Numer telefonu musi mieć 9 cyfr.'),
    email: string().nullable().optional().transform(value => !!value ? value : null).email('Niepoprawny e-mail.'),
    companyName: string().nullable().optional().transform(value => !!value ? value : null).min(2, 'Nazwa firmy musi mieć minimalnie 2 znaki.').max(25, 'Nazwa firmy musi mieć maksymalnie 25 znaków.'),
    nip: string().nullable().optional().transform(value => !!value ? value.replace(/\s*/g, '') : null).matches(/^\d*$/, 'Niepoprawny numer NIP.').length(10, 'Numer NIP musi mieć 10 cyfr.')
});

export const orderApiSchema = object({
    basket: array().required().of(array().length(2).of(number().positive())),
    deliveryId: number().required().integer().min(1),
    form: object({
        firstName: string().required().min(2).max(25),
        surname: string().required().min(2).max(25),
        address: string().required().min(5).max(60),
        postalCode: string().required().min(4).max(10),
        city: string().required().min(2).max(25),
        country: string().required().min(1).max(40),
        prefix: string().required().min(2).max(10),
        phoneNumber: string().required().transform((value) => value.replace(/\s*/g, '')).length(9),
        email: string().nullable().optional().transform(value => !!value ? value : null).email(),
        companyName: string().nullable().optional().transform(value => !!value ? value : null).min(2).max(25),
        nip: string().nullable().optional().transform(value => !!value ? value.replace(/\s*/g, '') : null).matches(/^\d*$/, 'Invalid NIP number.').length(10)
    }).required()
})

export type IOrderApiSchema = TypeOf<typeof orderApiSchema>;