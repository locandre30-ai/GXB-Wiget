import { newProfile } from './store.mjs';

// The shell uses this identity contract for listing, selection and creation.
// A managed adapter can supply remote identities after an explicit sign-in.
export class LocalIdentity {
  constructor(store) {
    this.store = store;
  }

  list() {
    return Object.entries(this.store.book.profiles).map(([id, { name, icon, experience, origin }]) =>
      ({ id, name, icon, experience, origin }));
  }

  async select(id, experience) {
    const book = this.store.book;
    if (!Object.hasOwn(book.profiles, id)) throw new Error('Select an existing local profile.');
    const profile = book.profiles[id];
    if (experience !== profile.experience) {
      profile.experience = experience;
      profile.state.mode = experience === 'experienced' ? 'pro' : 'guided';
    }
    profile.onboarded = true;
    book.active = id;
    return this.store.save(book);
  }

  async create(name, experience) {
    const book = this.store.book;
    const id = crypto.randomUUID();
    book.profiles[id] = newProfile(name, experience);
    book.active = id;
    return this.store.save(book);
  }
}
