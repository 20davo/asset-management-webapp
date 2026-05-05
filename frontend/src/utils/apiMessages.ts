import type { Language } from '../context/LanguageContext'

const apiMessages = {
  'auth.registrationDisabled': {
    en: 'New user registration is disabled in this environment.',
    hu: 'Az új felhasználói regisztráció ebben a környezetben le van tiltva.',
  },
  'auth.invalidEmail': {
    en: 'Please enter a valid email address.',
    hu: 'Adj meg egy érvényes email címet.',
  },
  'auth.emailAlreadyExists': {
    en: 'A user with this email address already exists.',
    hu: 'Már létezik felhasználó ezzel az email címmel.',
  },
  'auth.registered': {
    en: 'Registration completed successfully.',
    hu: 'Sikeres regisztráció.',
  },
  'auth.invalidCredentials': {
    en: 'The email address or password is incorrect.',
    hu: 'Hibás email vagy jelszó.',
  },
  'auth.loginSuccess': {
    en: 'Signed in successfully.',
    hu: 'Sikeres bejelentkezés.',
  },
  'auth.invalidTokenUser': {
    en: 'The signed-in user could not be identified.',
    hu: 'Érvénytelen felhasználói azonosító a tokenben.',
  },
  'auth.userNotFound': {
    en: 'User not found.',
    hu: 'A felhasználó nem található.',
  },
  'auth.currentPasswordInvalid': {
    en: 'The current password is incorrect.',
    hu: 'A jelenlegi jelszó hibás.',
  },
  'auth.passwordsDoNotMatch': {
    en: 'The new passwords do not match.',
    hu: 'Az új jelszavak nem egyeznek.',
  },
  'auth.passwordUnchanged': {
    en: 'The new password cannot be the same as the current password.',
    hu: 'Az új jelszó nem lehet ugyanaz, mint a jelenlegi.',
  },
  'auth.passwordUpdated': {
    en: 'Password updated successfully.',
    hu: 'A jelszó sikeresen frissítve.',
  },
  'rateLimit.login': {
    en: 'Too many sign-in attempts. Please try again later.',
    hu: 'Túl sok bejelentkezési próbálkozás. Próbáld újra később.',
  },
  'rateLimit.generic': {
    en: 'Too many requests. Please try again later.',
    hu: 'Túl sok kérés. Próbáld újra később.',
  },
  'equipment.imageTooLarge': {
    en: 'The image must be 2 MB or smaller.',
    hu: 'A kép mérete legfeljebb 2 MB lehet.',
  },
  'equipment.imageInvalidType': {
    en: 'Only JPG, PNG, or WEBP images can be uploaded.',
    hu: 'Csak JPG, PNG vagy WEBP kép tölthető fel.',
  },
  'equipment.imageInvalidFile': {
    en: 'The uploaded file is not a valid image.',
    hu: 'A feltöltött fájl nem érvényes képfájl.',
  },
  'equipment.imageInvalidContent': {
    en: 'The uploaded file content does not match a supported image format.',
    hu: 'A feltöltött fájl tartalma nem egyezik egy támogatott képformátummal.',
  },
  'equipment.imageInvalidName': {
    en: 'Invalid image file name.',
    hu: 'Érvénytelen képfájlnév.',
  },
  'equipment.notFound': {
    en: 'Asset not found.',
    hu: 'Az eszköz nem található.',
  },
  'equipment.serialAlreadyExists': {
    en: 'An asset with this serial number already exists.',
    hu: 'Már létezik eszköz ezzel a gyári számmal.',
  },
  'equipment.serialUsedByOtherAsset': {
    en: 'Another asset already uses this serial number.',
    hu: 'Már létezik másik eszköz ezzel a gyári számmal.',
  },
  'equipment.created': {
    en: 'Asset created successfully.',
    hu: 'Az eszköz létrejött.',
  },
  'equipment.updated': {
    en: 'Asset updated successfully.',
    hu: 'Az eszköz frissítve lett.',
  },
  'equipment.deleteActiveCheckoutBlocked': {
    en: 'This asset cannot be deleted while it is checked out.',
    hu: 'Az eszköz nem törölhető, mert jelenleg ki van kérve.',
  },
  'equipment.deleted': {
    en: 'Asset deleted successfully.',
    hu: 'Az eszköz törölve lett.',
  },
  'equipment.dueDateMustBeFuture': {
    en: 'The due date must be in the future.',
    hu: 'A határidőnek jövőbeli dátumnak kell lennie.',
  },
  'equipment.notAvailableForCheckout': {
    en: 'This asset is not currently available for assignment.',
    hu: 'Az eszköz jelenleg nem érhető el kiadásra.',
  },
  'equipment.adminAssignmentUserRequired': {
    en: 'Select the user who should receive this asset.',
    hu: 'Válaszd ki, melyik felhasználóhoz rendeled az eszközt.',
  },
  'equipment.adminSelfAssignmentBlocked': {
    en: 'Admins cannot assign an asset to themselves.',
    hu: 'Az admin nem kérheti ki saját magának az eszközt.',
  },
  'equipment.assignedUserNotFound': {
    en: 'The selected user was not found.',
    hu: 'A kiválasztott felhasználó nem található.',
  },
  'equipment.assignOnlyRegularUser': {
    en: 'Assets can only be assigned to regular users.',
    hu: 'Az eszköz csak normál felhasználóhoz rendelhető.',
  },
  'equipment.assigned': {
    en: 'Asset assigned successfully.',
    hu: 'Az eszköz ki lett adva.',
  },
  'equipment.checkedOut': {
    en: 'Asset checked out successfully.',
    hu: 'Az eszköz sikeresen kikérve.',
  },
  'equipment.noActiveCheckout': {
    en: 'This asset has no active assignment.',
    hu: 'Ehhez az eszközhöz nincs aktív kiadás.',
  },
  'equipment.returned': {
    en: 'Asset returned successfully.',
    hu: 'Az eszköz sikeresen visszahozva.',
  },
  'equipment.maintenanceCheckedOutBlocked': {
    en: 'A checked-out asset cannot be moved to maintenance.',
    hu: 'A kikért eszköz nem állítható karbantartás alá.',
  },
  'equipment.maintenanceAlready': {
    en: 'This asset is already in maintenance.',
    hu: 'Az eszköz már karbantartás alatt van.',
  },
  'equipment.maintenanceMarked': {
    en: 'Asset moved to maintenance.',
    hu: 'Az eszköz karbantartásra került.',
  },
  'equipment.availableRequiresMaintenance': {
    en: 'Only assets in maintenance can be marked as available.',
    hu: 'Csak karbantartás alatt lévő eszköz állítható elérhetőre.',
  },
  'equipment.availableMarked': {
    en: 'Asset is available again.',
    hu: 'Az eszköz újra elérhető.',
  },
  'checkout.notFound': {
    en: 'Assignment not found.',
    hu: 'A kiadás nem található.',
  },
  'user.notFound': {
    en: 'User not found.',
    hu: 'A felhasználó nem található.',
  },
  'user.invalidEmail': {
    en: 'Please enter a valid email address for this user.',
    hu: 'Adj meg egy érvényes email címet a felhasználóhoz.',
  },
  'user.invalidRole': {
    en: 'The selected role is invalid.',
    hu: 'A megadott szerepkör érvénytelen.',
  },
  'user.selfRoleChangeBlocked': {
    en: 'You cannot remove your own admin role here.',
    hu: 'A saját admin jogosultságodat itt nem veheted el.',
  },
  'user.emailAlreadyExists': {
    en: 'Another user already uses this email address.',
    hu: 'Már létezik másik felhasználó ezzel az email címmel.',
  },
  'user.lastAdminRoleBlocked': {
    en: 'The last admin role cannot be removed.',
    hu: 'Az utolsó admin jogosultsága nem vehető el.',
  },
  'user.selfDeleteBlocked': {
    en: 'You cannot delete your own account here.',
    hu: 'A saját fiókodat itt nem törölheted.',
  },
  'user.lastAdminDeleteBlocked': {
    en: 'The last admin cannot be deleted.',
    hu: 'Az utolsó admin nem törölhető.',
  },
  'user.deleted': {
    en: 'User and related records deleted.',
    hu: 'A felhasználó és a hozzá tartozó rekordok törölve lettek.',
  },
} as const

export type ApiMessageCode = keyof typeof apiMessages

export function getApiMessage(code: unknown, language: Language) {
  if (typeof code !== 'string' || !(code in apiMessages)) {
    return null
  }

  return apiMessages[code as ApiMessageCode][language]
}
