export const RandomHelper = {
  nanoid: (size: number) => {
    const alphabet =
      "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let nanoid = "";
    for (let i = 0; i < size; i++) {
      nanoid += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return nanoid;
  },

  pickOneAtRandom: <T>(arr: T[]): T => {
    return arr[Math.floor(Math.random() * arr.length)];
  },
};
