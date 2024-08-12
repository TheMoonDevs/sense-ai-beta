import { defineHelper } from "@genkit-ai/dotprompt";

import { promptBreakdownFlow } from "./prompt/promptBreakdown";
import { PromptFetchFlow } from "./prompt/promptFetch";
import { promptImageFlow } from "./prompt/media/promptImage";
import { promptRandomFlow } from "./prompt/promptRandom";
import { promptSurveysFetchFlow } from "./survey/prompt_finetuning/fetchPromptSurveys";
import { generatePromptSurveysFlow } from "./survey/prompt_finetuning/generatePromptSurveys";
import { FetchUserInfoFlow } from "./userInfo/fetchUserInfo";
import { UpdateUserInfoFlow } from "./userInfo/updateUserInfo";
import { genUserTasteSurveyFlow } from "./survey/userTaste_survey/genUserTasteSurvey";
import { fetchSingleSurveyFlow } from "./survey/fetchSingleSurvey";
import { promptFinetuningFlow } from "./survey/prompt_finetuning/promptFinetuning";
import { genCuratedInterestsFlow } from "./interests/genCuratedInterests";
import { genImagesFlow } from "./images/genImages";
import { genHomeFeedFlow } from "./homefeed/genHomeFeed";
import { promptAudioFlow } from "./prompt/media/promptAudio";
import { extendSelectableSurveyFlow } from "./survey/extendSelectableSurvey";
import { homeFeedFetchFlow } from "./homefeed/fetchHomeFeed";
import { fetchCuratedIterestsFlow } from "./interests/fetchCuratedInterests";
import { genKeywordsFlow } from "./common/genKeywords";
import { saveCuratedInterestFlow } from "./interests/saveCuratedInterest";
import { genInterestLearningTopicsFlow } from "./interests/genLearningTopics";
import { genInterstQuizFlow } from "./survey/interest_survey/genInterstQuizFlow";
import { deleteCuratedInterestFlow } from "./interests/deleteCuratedInterest";
import { genInterestBreakdownFlow } from "./interests/genInterestBreakdown";
import { fetchListofInterestListsFlow } from "./interests/fetchListofInterestLists";
import { genUserPrefFlow } from "./userPref/genUserPref";
import { genInterstQuizFlow2 } from "./survey/interest_survey/genInterestQuizFlow2";
import { genQueryBasedFeedFlow } from "./homefeed/genQueryBasedFeed";
import { genUserInterstQuizFlow2 } from "./userInterest/genUserInterstQuiz2";
import { fetchUserPrefsFlow } from "./userPref/fecthUserPrefs";
import { fetchIsFollowedFlow } from "./interests/fetchIsFollowedFlow";
import { fetchUserIterestsFlow } from "./userInterest/fetchUserInterests";
import { genActionLinkFlow } from "./actionLink/genActionLink";
import { genStreakDataFlow } from "./streak/genStreakDataFlow";
import { genRandomFactsFromKeyword } from "./common/genRandomFactsFromKeyword";
import { autoSetupInterestFlow } from "./interests/autoSetupInterest";
import { genTutorBotFlow } from "./tutorBot/genTutorBot";
import { fetchUserBotsFlow } from "./tutorBot/fetchUserBotsFlow";
import { fetchLeaderboardDataFlow } from "./userInterest/fetchLeaderboardData";
import { submitSurveyResponseFlow } from "./survey/submitSurveyResponse";
import { updateUserDataFlow } from "./user/updateUserData";
import { genPromptFeedFlow } from "./homefeed/genPromptFeed";

export default [
  genRandomFactsFromKeyword,
  genStreakDataFlow,
  genKeywordsFlow,
  promptAudioFlow,
  promptBreakdownFlow,
  promptRandomFlow,
  // promptAudioFlow,
  promptImageFlow,
  PromptFetchFlow,
  promptSurveysFetchFlow,
  generatePromptSurveysFlow,
  FetchUserInfoFlow,
  UpdateUserInfoFlow,
  genUserTasteSurveyFlow,
  fetchSingleSurveyFlow,
  promptFinetuningFlow,
  genCuratedInterestsFlow,
  genInterestBreakdownFlow,
  genInterestLearningTopicsFlow,
  fetchCuratedIterestsFlow,
  fetchListofInterestListsFlow,
  saveCuratedInterestFlow,
  deleteCuratedInterestFlow,
  genImagesFlow,
  genHomeFeedFlow,
  homeFeedFetchFlow,
  extendSelectableSurveyFlow,
  genInterstQuizFlow,
  genActionLinkFlow,
  //genUserInterestQuizFlow,
  genUserInterstQuizFlow2,
  genInterstQuizFlow2,
  genUserPrefFlow,
  genQueryBasedFeedFlow,
  fetchUserPrefsFlow,
  fetchIsFollowedFlow,
  fetchUserIterestsFlow,
  fetchLeaderboardDataFlow,
  submitSurveyResponseFlow,
  autoSetupInterestFlow,
  fetchUserBotsFlow,
  genTutorBotFlow,
  updateUserDataFlow,
  genPromptFeedFlow,
];

defineHelper("stringify", (obj: any) => JSON.stringify(obj));
