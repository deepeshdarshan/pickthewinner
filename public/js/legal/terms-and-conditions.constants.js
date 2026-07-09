/**
 * @fileoverview Terms & Conditions content for the prediction contest.
 * @module legal/terms-and-conditions.constants
 */

/** @type {string} */
export const TERMS_INTRO =
  'Welcome to PickTheWinner! By registering and participating in the prediction contest, you agree to the following Terms & Conditions.';

/** @type {string} */
export const TERMS_SUMMARY_HEADING = 'Before you continue...';

/** @type {ReadonlyArray<string>} */
export const TERMS_SUMMARY_POINTS = Object.freeze([
  'You must be an eligible participant. Ernakulam Jilla Yuvavedi Executive Committee members cannot participate.',
  'Predictions open 12 hours before kickoff and close 15 minutes before kickoff (IST).',
  'Predictions cannot be edited after the deadline.',
  'Match points vary and are displayed before each prediction.',
  'Any form of cheating or malpractice will result in immediate disqualification.',
  'Keep your phone number up to date to remain eligible for prizes.',
  'Organizers\' decisions regarding scoring and winners are final.',
]);

/**
 * @typedef {Object} TermsSection
 * @property {number} number
 * @property {string} title
 * @property {string[]} [paragraphs]
 * @property {string[]} [bullets]
 * @property {string} [closingParagraph]
 */

/** @type {ReadonlyArray<TermsSection>} */
export const TERMS_SECTIONS = Object.freeze([
  {
    number: 1,
    title: 'Eligibility',
    paragraphs: [
      'Participation is open only to eligible contestants as determined by the contest organizers.',
      'Ernakulam Jilla Yuvavedi Executive Committee members are not eligible to participate in this contest. If an ineligible participant registers or participates, their entry will be disqualified without prior notice.',
    ],
  },
  {
    number: 2,
    title: 'Prediction Window',
    bullets: [
      'Predictions for each match will open 12 hours before the scheduled kickoff.',
      'Predictions will close 15 minutes before the scheduled kickoff.',
      'All timings are based on Indian Standard Time (IST).',
      'Once the prediction window closes, predictions cannot be created, edited, updated, or deleted under any circumstances.',
    ],
  },
  {
    number: 3,
    title: 'Match Scoring',
    paragraphs: [
      'Each match may have a different points configuration based on the tournament settings.',
      'Participants can earn points by:',
    ],
    bullets: [
      'Correctly predicting the final match score (Normal Time + Extra Time).',
      'Correctly predicting the Penalty Shootout Winner, applicable only if the match is tied after Normal Time + Extra Time.',
    ],
    closingParagraph:
      'The points allocated for each criterion will be displayed within the app before the prediction window opens for the respective match.',
  },
  {
    number: 4,
    title: 'Official Match Results & Points',
    paragraphs: [
      'Points will be awarded only after the official match result has been published by the tournament organizer.',
      'Once the results are processed:',
    ],
    bullets: [
      'Your prediction status will be updated.',
      'Your points will be calculated automatically.',
      'The leaderboard will be updated accordingly.',
    ],
  },
  {
    number: 5,
    title: 'Fair Play Policy',
    paragraphs: [
      'The contest is intended to be fair and transparent.',
      'The following actions may result in immediate disqualification:',
    ],
    bullets: [
      'Creating or using multiple accounts.',
      'Sharing accounts with others.',
      'Exploiting application bugs or loopholes.',
      'Attempting to manipulate predictions or scores.',
      'Providing false information.',
      'Any other form of malpractice or unfair conduct.',
    ],
    closingParagraph:
      'The organizers reserve the right to disqualify any participant found violating these rules.',
  },
  {
    number: 6,
    title: 'Valid Contact Information',
    paragraphs: [
      'Participants must provide a valid and active mobile number.',
      'Contestants with incorrect, invalid, or unreachable contact information may become ineligible for prizes or official communications.',
    ],
  },
  {
    number: 7,
    title: 'Leaderboard & Winners',
    paragraphs: [
      'The leaderboard displayed during the tournament is provisional and subject to verification.',
      'The final leaderboard and winners will be officially announced only after the completion of the World Cup Final.',
      'No claims regarding interim rankings will be entertained.',
    ],
  },
  {
    number: 8,
    title: 'Official Decisions',
    paragraphs: [
      'All decisions made by the contest organizers regarding:',
    ],
    bullets: [
      'Eligibility',
      'Prediction validation',
      'Points calculation',
      'Rankings',
      'Prize distribution',
      'Disqualification',
    ],
    closingParagraph: 'shall be final and binding.',
  },
  {
    number: 9,
    title: 'Match Changes',
    paragraphs: [
      'If a match is:',
    ],
    bullets: [
      'postponed,',
      'abandoned,',
      'cancelled,',
      'replayed,',
      'suspended,',
      'awarded by walkover,',
      'or its official result is revised,',
    ],
    closingParagraph:
      'the organizers reserve the right to modify prediction processing and point allocation accordingly. The organizers\' decision in such situations shall be final.',
  },
  {
    number: 10,
    title: 'Technical Responsibility',
    paragraphs: [
      'Participants are responsible for ensuring that they have:',
    ],
    bullets: [
      'a stable internet connection,',
      'a compatible device,',
      'and sufficient time to submit predictions before the prediction window closes.',
    ],
    closingParagraph:
      'The organizers will not be responsible for missed predictions due to internet connectivity issues, device failures, browser issues, power failures, or late submissions.',
  },
  {
    number: 11,
    title: 'No Late Requests',
    paragraphs: [
      'Once the prediction window closes, no requests to modify predictions, reopen predictions, submit missed predictions, or manually update scores will be accepted.',
    ],
  },
  {
    number: 12,
    title: 'Rule Changes',
    paragraphs: [
      'The organizers reserve the right to modify, update, suspend, or withdraw any contest rule whenever necessary.',
      'Any important updates will be communicated through the application.',
    ],
  },
  {
    number: 13,
    title: 'Privacy',
    paragraphs: [
      'The personal information collected during registration will be used solely for participant identification, contest administration, winner verification, and official communication.',
      'Participant information will not be shared with third parties except where required by law.',
    ],
  },
  {
    number: 14,
    title: 'Support & Queries',
    paragraphs: [
      'If you experience any issues related to registration, login, prediction submission, leaderboard, points calculation, or technical problems, please contact:',
    ],
  },
  {
    number: 15,
    title: 'Acceptance of Terms',
    paragraphs: [
      'By registering for and participating in the PickTheWinner Prediction Contest, you confirm that:',
    ],
    bullets: [
      'You have read and understood these Terms & Conditions.',
      'You agree to abide by all contest rules.',
      'You accept the decisions of the organizers as final.',
      'You agree to participate fairly and responsibly.',
    ],
  },
]);
