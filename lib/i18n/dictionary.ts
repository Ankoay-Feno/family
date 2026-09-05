// Contrat commun des deux dictionnaires (mg/fr). Un champ manquant dans l'une
// des deux langues est une erreur de type — voir dictionaries/fr.ts et mg.ts.

export type Locale = "mg" | "fr";

export const LOCALES: Locale[] = ["mg", "fr"];
export const DEFAULT_LOCALE: Locale = "mg";
export const LOCALE_COOKIE = "locale";

/** Étiquette de lien de parenté retournée par lib/family.ts (logique pure,
 *  sans texte) — la mise en mots vit dans le dictionnaire de chaque langue. */
export type RelationKey =
  | "you"
  | "father"
  | "mother"
  | "son"
  | "daughter"
  | "brother"
  | "sister"
  | "grandfather"
  | "grandmother"
  | "grandson"
  | "granddaughter"
  | "greatGrandfather"
  | "greatGrandmother"
  | "greatGrandson"
  | "greatGranddaughter"
  | "uncle"
  | "aunt"
  | "nephew"
  | "niece"
  | "cousinM"
  | "cousinF"
  | "husband"
  | "wife"
  | "sisterInLaw"
  | "brotherInLaw"
  | "daughterInLaw"
  | "sonInLaw"
  | "motherInLaw"
  | "fatherInLaw"
  | "familyMember";

export type Dictionary = {
  common: {
    appName: string;
    cancel: string;
    close: string;
    copy: string;
    copied: string;
    unexpectedError: string;
    cardSuffix: (personName: string) => string;
    roleLabel: string;
  };
  languageSwitcher: {
    label: string;
  };
  nav: {
    platform: string;
    administration: string;
    signOut: string;
    backToTree: string;
  };
  home: {
    eyebrow: string;
    stats: (generations: number, members: number, linked: number) => string;
    footer: string;
  };
  login: {
    eyebrow: string;
    email: string;
    password: string;
    passwordHint: string;
    submit: string;
    submitPending: string;
    invalidCredentials: string;
    genericError: string;
    note: string;
  };
  signup: {
    yourName: string;
    email: string;
    password: string;
    passwordHint: string;
    createAccount: string;
    creating: string;
    login: string;
    loggingIn: string;
    createdNotice: string;
    alreadyAccountQuestion: string;
    switchToLogin: string;
    noAccountQuestion: string;
    switchToSignup: string;
    invalidCredentials: string;
    genericError: string;
  };
  createFamily: {
    welcomeEyebrow: string;
    title: string;
    treeName: string;
    yourNameInTree: string;
    youAre: string;
    woman: string;
    man: string;
    birthYearOptional: string;
    submit: string;
    submitting: string;
    note: string;
  };
  pendingRequest: {
    eyebrow: string;
    message: (treeName: string) => string;
  };
  tree: {
    addMember: string;
    bornF: (year: number) => string;
    bornM: (year: number) => string;
    youChip: string;
    emptySelection: string;
    panel: {
      birth: string;
      birthWithAge: (year: number, age: number) => string;
      death: string;
      account: string;
      accountLinked: string;
      accountNone: string;
      spouse: string;
      email: string;
    };
    relations: Record<RelationKey, string>;
  };
  addMember: {
    title: string;
    name: string;
    nickname: string;
    sex: string;
    woman: string;
    man: string;
    birthYearOptional: string;
    emailOptional: string;
    photoOptional: string;
    relation: string;
    relationChild: string;
    relationParent: string;
    relationSpouse: string;
    relativeTo: string;
    spouseHint: string;
    propose: string;
    add: string;
    sending: string;
    proposalSentTitle: string;
    proposalSentBody: string;
    memberHint: string;
    parentHint: string;
  };
  photo: {
    addPhoto: string;
    changePhoto: string;
    addCover: string;
    changeCover: string;
    sending: string;
    uploadFailed: string;
  };
  nickname: {
    add: string;
    edit: string;
    save: string;
    saving: string;
  };
  invite: {
    button: string;
    dialogTitle: (name: string) => string;
    linkHint: (name: string) => string;
    generateHint: (name: string) => string;
    generate: string;
    generating: string;
  };
  acceptInvite: {
    accept: string;
    accepting: string;
  };
  invitePage: {
    eyebrow: string;
    invalidOrRevoked: string;
    alreadyUsed: (name: string) => string;
    expired: (treeName: string) => string;
    login: string;
    offer: (treeName: string, personName: string) => string;
    createAccountHint: string;
  };
  join: {
    eyebrow: string;
    invalidLink: string;
    createAccountHint: string;
    alreadyMember: string;
    viewTree: string;
    pendingReview: string;
    whoAreYou: string;
    messagePlaceholder: string;
    submit: string;
    sending: string;
    sentNotice: (treeName: string) => string;
  };
  admin: {
    eyebrow: string;
    presentationLink: {
      title: string;
      hint: string;
    };
    proposals: {
      title: string;
      hint: string;
      empty: string;
      proposedBy: (name: string, date: string) => string;
      approve: string;
      approving: string;
      reject: string;
      rejecting: string;
      rejectReasonPlaceholder: string;
      rejectReasonLabel: string;
      describeAdd: (name: string, details: string, relPhrase: string) => string;
      relAsChildOf: (anchor: string) => string;
      relAsParentOf: (anchor: string) => string;
      relAsSpouseOf: (anchor: string) => string;
      deletedPerson: string;
    };
    joinRequests: {
      title: string;
      hint: string;
      empty: string;
      linkToExisting: string;
      linkPersonLabel: string;
      approve: string;
      approving: string;
      createCard: string;
      name: string;
      sex: string;
      woman: string;
      man: string;
      birthYearOptional: string;
      relation: string;
      relationChild: string;
      relationParent: string;
      relationSpouse: string;
      relativeTo: string;
      reject: string;
      rejecting: string;
    };
    invitations: {
      title: string;
      hint: string;
      empty: string;
      expiresOn: (date: string) => string;
      expired: string;
      revoke: string;
    };
    members: {
      title: string;
      hint: string;
      roleAdmin: string;
      roleParent: string;
      roleMember: string;
      giveParentRole: string;
      backToMember: string;
    };
  };
  platform: {
    eyebrow: string;
    title: string;
    listSection: {
      title: (count: number) => string;
      hint: string;
      createdOn: (date: string) => string;
      stats: (generations: number, members: number, linked: number, admins: number) => string;
      pending: (count: number) => string;
      viewReadOnly: string;
      empty: string;
    };
    createSection: {
      title: string;
      hint: string;
    };
    createForm: {
      familyName: string;
      founderName: string;
      sex: string;
      woman: string;
      man: string;
      birthYearOptional: string;
      emailOptional: string;
      submit: string;
      submitting: string;
      createdNotice: string;
    };
    familyActions: {
      regenerate: string;
      regenerating: string;
      deleteFamily: string;
      confirmDelete: (name: string) => string;
      confirm: string;
      deleting: string;
      cancel: string;
    };
    familyDetail: {
      eyebrow: string;
      backToList: string;
      stats: (generations: number, members: number) => string;
      accountsSection: {
        title: string;
        hint: string;
        empty: string;
      };
    };
    memberRole: {
      roleAdmin: string;
      roleParent: string;
      roleMember: string;
      apply: string;
    };
  };
  errors: {
    notLoggedIn: string;
    treeNameRequired: string;
    founderNameRequired: string;
    sexRequired: string;
    invalidBirthYear: string;
    invalidEmail: string;
    nameRequired: string;
    nicknameTooLong: (max: number) => string;
    invalidRelationType: string;
    anchorNotFound: string;
    personNotFound: string;
    personNotFoundInFamily: string;
    cardNotFoundInTree: string;
    personAlreadyLinked: string;
    personAlreadyLinkedNamed: (name: string) => string;
    alreadyHasSpouse: (name: string) => string;
    alreadyHasBothParents: (name: string) => string;
    adminOnly: string;
    notMember: string;
    invitationNotFound: string;
    invitationAlreadyUsed: string;
    unauthorizedPhotoUrl: string;
    photoTooLarge: string;
    unsupportedPhotoFormat: string;
    noPhotoReceived: string;
    invitationExpired: string;
    otherCardAlreadyLinked: string;
    onlyOneFamilyPerAccount: string;
    alreadyInFamily: string;
    personAlreadyInFamily: string;
    familyNotFound: string;
    platformAdminOnly: string;
    linkInvalid: string;
    messageRequired: string;
    messageTooLong: string;
    requestNotFound: string;
    requestAlreadyHandled: string;
    requestAlreadyPending: string;
    invalidReasonLength: string;
    lastAdminRequired: string;
    invalidRole: string;
    limitedRoleGrant: string;
    membershipNotFound: string;
    proposalNotFound: string;
    proposalAlreadyHandled: string;
    unknownProposalType: string;
    cannotApply: (reason: string) => string;
    membershipEditAdminOnly: string;
    founderAlreadyJoined: string;
    noFounder: string;
    ownPhotoOnly: string;
    ownNicknameOnly: string;
    invalidPhotoKind: string;
  };
};
