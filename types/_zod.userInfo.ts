import { z } from "zod";

const zEmploymentTypeEnum = z.enum([
  "full-time",
  "part-time",
  "contract",
  "freelance",
]);

const zMaritalStatusEnum = z.enum(["single", "married", "divorced", "widowed"]);

const zFamilyStructureEnum = z.enum(["nuclear", "joint", "single-parent"]);

const zGenderEnum = z.enum([
  "male",
  "female",
  "non-binary",
  "prefer not to say",
]);

const zDegreeEnum = z.enum([
  "High School",
  "Associate's Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "Doctorate",
  "Other",
]);

export const zDegreeSchema = z.array(
  z.object({
    degreeType: zDegreeEnum.optional(),
    institution: z.string().optional(),
    fieldOfStudy: z.string().optional(),
    graduationYear: z.number().int().min(1900).optional(),
  })
);

// const FavoriteTypeEnum = z.enum([
//   "Color",
//   "Cuisine",
//   "MusicGenre",
//   "MovieGenre",
//   "BookGenre",
//   "Sport",
//   "Hobby",
//   "Season",
//   "HolidayDestination",
// ]);

// export const zFavoritesSchema = z.object({
//   type: FavoriteTypeEnum,
//   value: z.string().optional(), // User input
//   context: z.string().optional(), // AI-generated description
// });

// const PreferenceTypeEnum = z.enum(["Pet", "ArtStyle", "FashionStyle"]);

// export const zPreferencesSchema = z.object({
//   type: PreferenceTypeEnum,
//   value: z.array(z.string().optional()).optional(), // User Preferences
//   context: z.string().optional(), // AI-generated description
// });

export const zUserTasteValues = z.object({
  type: z.string(),
  value: z.string().or(z.array(z.string())).optional(),
  context: z.string().optional(),
});

export const zUserTasteSchema = z.object({
  favorites: z.array(zUserTasteValues).optional(),
  preferences: z.array(zUserTasteValues).optional(),
  additionalLikes: z.array(zUserTasteValues).optional(),
  // hobbies: z.array(zUserTasteValues).optional(),
  // additionalDislikes: z.array(zUserTasteValues).optional(),
  // currentKeywords: z.array(z.string()).optional(),
});

export const zUserProfessionSchema = z.object({
  jobTitle: z.string().optional(),
  skills: z.array(z.string()).optional(),
  yearsOfExperience: z.number().optional(),
  company: z.string().optional(),
  employmentType: zEmploymentTypeEnum.optional(),
  remoteWork: z.boolean().optional(),
  industry: z.string().optional(),
  workLocation: z.string().optional(),
});

export const zUserAcademicsSchema = z.object({
  highestDegree: zDegreeEnum.optional(),
  degrees: zDegreeSchema.optional(),
  certifications: z.array(z.string()).optional(), // Professional certifications or licenses
  languagesSpoken: z.array(z.string()).optional(),
});

export const zUserBackgroundSchema = z.object({
  religion: z.string().optional(),
  caste: z.string().optional(),
  race: z.string().optional(),
  ethnicity: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  currentLocation: z.string().optional(),
  maritalStatus: zMaritalStatusEnum.optional(),
  children: z.number().optional(),
  familyStructure: zFamilyStructureEnum.optional(),
  dateOfBirth: z.date().optional(),
  gender: zGenderEnum.optional(),
});
