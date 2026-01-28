# SNEHA Voice Assistant - Test Cases

## Phase 1 & 2: Basic Navigation & Command Understanding

### Test Case 1.1: Basic Navigation Commands
**Test**: Navigate to different pages using voice commands
**Commands to try**:
- "Go to schedule"
- "Open academics"
- "Show resources"
- "Navigate to campus"
- "Go to community"
- "Open services"
- "Show extras"
- "Go home"
- "Go to dashboard"

**Expected Result**: SNEHA should navigate to the correct page and confirm navigation verbally.

---

### Test Case 1.2: Attendance Check
**Test**: Check attendance status
**Commands to try**:
- "Check my attendance"
- "Show my attendance"
- "Open attendance tracker"

**Expected Result**: Navigate to `/academics?section=attendance` and confirm verbally.

---

### Test Case 1.3: Schedule Queries
**Test**: View schedule information
**Commands to try**:
- "Check my schedule"
- "What's my schedule"
- "Show my schedule today"
- "What's my schedule today"

**Expected Result**: Navigate to schedule page and confirm verbally.

---

### Test Case 1.4: Results Check
**Test**: View academic results
**Commands to try**:
- "Check my results"
- "Show my grades"
- "Open results"

**Expected Result**: Navigate to `/academics?section=results` and confirm verbally.

---

### Test Case 1.5: PYQ Download
**Test**: Download Previous Year Question papers
**Commands to try**:
- "Download PYQ for Artificial Intelligence semester 5"
- "Download py for AI sem 5"
- "Download pyq for Machine Learning semester 3"
- "Get PYQ for Data Structures semester 4"

**Expected Result**: 
- SNEHA should find the PYQ in database
- Initiate download or navigate to PYQ page with filters
- Confirm action verbally

---

### Test Case 1.6: Resource Navigation
**Test**: Navigate to different resource sections
**Commands to try**:
- "Open PYQs"
- "Show question papers"
- "Open notes"
- "Show my notes"
- "Open assignments"
- "Show my assignments"

**Expected Result**: Navigate to respective resource pages and confirm verbally.

---

### Test Case 1.7: Policy & SRB Navigation
**Test**: Open policy and SRB sections
**Commands to try**:
- "Open Student Resource Book"
- "Show SRB"
- "Open examination policy"
- "Show policy"
- "Open rules"

**Expected Result**: Navigate to respective sections and confirm verbally.

---

## Phase 3: Query Capabilities (SRB & Policy Queries)

### Test Case 3.1: SRB Query - Basic Questions
**Test**: Ask questions about Student Resource Book
**Commands to try**:
- "Ask SRB about attendance requirements"
- "What does the student resource book say about grading"
- "SRB question: What are the attendance rules?"
- "Ask SRB about examination policies"

**Expected Result**: 
- SNEHA should query the SRB API
- Get answer from Student Resource Book
- Speak the answer (max 500 chars for voice)
- Display full answer in UI

---

### Test Case 3.2: SRB Query - Speech Recognition Error Handling
**Test**: Handle "SRB" being misrecognized as "ask me"
**Commands to try**:
- "SRB" (if recognized as "ask me")
- "SRB about attendance"
- "Ask me about grading" (should be corrected to SRB query)

**Expected Result**: 
- System should correct "ask me" → "SRB"
- Process as SRB query
- Return appropriate answer

---

### Test Case 3.3: Policy Query - Basic Questions
**Test**: Ask questions about Examination Policy
**Commands to try**:
- "Ask policy about UFM"
- "What does the examination policy say about unfair means"
- "Policy question: What are the attendance requirements for exams?"
- "Ask policy about grading system"

**Expected Result**: 
- SNEHA should query the Examination Policy API
- Get answer from policy document
- Speak the answer (max 500 chars for voice)
- Display full answer in UI

---

### Test Case 3.4: Policy Query - Follow-up Questions
**Test**: Ask follow-up questions about policy
**Commands to try**:
1. "Ask policy about UFM"
2. Wait for response
3. "Tell me more about that"
4. "What are the consequences?"

**Expected Result**: 
- Should use conversation history
- Provide context-aware follow-up answers
- Maintain conversation context

---

### Test Case 3.5: SRB Query - Complex Questions
**Test**: Ask detailed questions about SRB
**Commands to try**:
- "Ask SRB about the minimum attendance percentage required for placement eligibility"
- "What does the student resource book say about re-admission process"
- "SRB question: Explain the grading system for semester end examinations"

**Expected Result**: 
- Should extract relevant information from SRB
- Provide detailed answers
- Handle complex queries appropriately

---

## Phase 4: Multi-turn Conversations & Proactive Assistance

### Test Case 4.1: Multi-turn SRB Conversation
**Test**: Maintain context across multiple SRB questions
**Commands to try**:
1. "Ask SRB about attendance"
2. Wait for response
3. "What about minimum percentage?"
4. "And for placement subjects?"
5. "Tell me more"

**Expected Result**: 
- Each follow-up should use previous conversation context
- Answers should be contextually relevant
- SNEHA should remember the topic being discussed

---

### Test Case 4.2: Multi-turn Policy Conversation
**Test**: Maintain context across multiple policy questions
**Commands to try**:
1. "Ask policy about UFM"
2. Wait for response
3. "What happens if caught?"
4. "Are there any exceptions?"
5. "Explain the process"

**Expected Result**: 
- Should maintain policy conversation context
- Provide coherent follow-up answers
- Remember previous questions in the conversation

---

### Test Case 4.3: Proactive Alerts - Class Reminders
**Test**: Receive automatic class reminders
**Setup**: 
- Upload timetable with classes
- Wait for a class that starts in 15 minutes or less

**Expected Result**: 
- Alert card should appear in top-right corner
- Browser notification should appear (if permission granted)
- Alert should show: "Class starting soon: [Subject] - starts in X minutes"
- Alert should be color-coded (red for high priority, yellow for medium)

---

### Test Case 4.4: Proactive Alerts - Voice Check
**Test**: Check alerts using voice commands
**Commands to try**:
- "Check alerts"
- "Show alerts"
- "What are my alerts"
- "Any reminders"

**Expected Result**: 
- SNEHA should fetch current alerts
- Announce high-priority alerts first
- Provide summary of all alerts
- Say "no alerts" if none exist

---

### Test Case 4.5: Alert Dismissal
**Test**: Dismiss proactive alerts
**Steps**:
1. Wait for alerts to appear
2. Click X button on alert card
3. Check if alert disappears

**Expected Result**: 
- Alert should disappear with animation
- Should not reappear until new alert is generated
- Other alerts should remain visible

---

### Test Case 4.6: Alert Navigation
**Test**: Navigate to relevant page from alert
**Steps**:
1. Wait for class reminder alert
2. Click "View" button on alert
3. Check navigation

**Expected Result**: 
- Should navigate to `/schedule` page
- Should open in same tab
- Alert should remain dismissible

---

### Test Case 4.7: Browser Notifications
**Test**: Receive browser notifications for high-priority alerts
**Setup**:
- Grant notification permission when prompted
- Wait for high-priority alert (class starting in ≤5 minutes)

**Expected Result**: 
- Browser notification should appear
- Should show alert title and message
- Should use CampusIQ logo as icon
- Should not duplicate notifications

---

### Test Case 4.8: Proactive Alerts - Periodic Check
**Test**: Verify alerts are checked automatically
**Steps**:
1. Open app
2. Wait 5 minutes
3. Check browser console for API calls

**Expected Result**: 
- Alerts should be checked immediately on load
- Should check again every 5 minutes
- Should update alerts dynamically

---

## Cross-Phase Test Cases

### Test Case X.1: Mixed Commands
**Test**: Mix navigation and query commands
**Commands to try**:
1. "Go to schedule"
2. "Ask SRB about attendance"
3. "Check my attendance"
4. "Download PYQ for AI semester 5"
5. "Check alerts"

**Expected Result**: 
- Each command should execute correctly
- No interference between commands
- SNEHA should handle transitions smoothly

---

### Test Case X.2: Error Handling
**Test**: Handle invalid or unclear commands
**Commands to try**:
- "Do something random"
- "Tell me a joke"
- "What's the weather"
- "Open something that doesn't exist"

**Expected Result**: 
- SNEHA should respond politely
- Should say "I didn't understand" or similar
- Should suggest available commands
- Should not crash or show errors

---

### Test Case X.3: Voice Recognition Accuracy
**Test**: Test with different speaking styles
**Commands to try**:
- Speak clearly and slowly
- Speak quickly
- Speak with background noise
- Speak with accent variations

**Expected Result**: 
- Should handle various speaking styles
- Should correct common misrecognitions (e.g., "ask me" → "SRB")
- Should ask for clarification if unclear

---

### Test Case X.4: Conversation History Persistence
**Test**: Verify conversation history is maintained
**Steps**:
1. Ask "Ask SRB about attendance"
2. Wait for response
3. Ask "What about minimum percentage?"
4. Close and reopen SNEHA panel
5. Ask "Tell me more"

**Expected Result**: 
- Should maintain context within session
- Follow-up questions should work
- Context should be relevant to previous questions

---

## Performance Test Cases

### Test Case P.1: Response Time
**Test**: Measure response time for different commands
**Commands to test**:
- Navigation commands (should be instant)
- PYQ downloads (should be <3 seconds)
- SRB queries (should be <5 seconds)
- Policy queries (should be <5 seconds)
- Alert checks (should be <2 seconds)

**Expected Result**: 
- All commands should respond within acceptable time
- No noticeable lag or delay
- Smooth user experience

---

### Test Case P.2: Multiple Rapid Commands
**Test**: Send multiple commands quickly
**Steps**:
1. Say "Go to schedule"
2. Immediately say "Check attendance"
3. Immediately say "Open SRB"

**Expected Result**: 
- Should queue commands properly
- Should process each command sequentially
- Should not skip or miss commands
- Should handle interruptions gracefully

---

## Edge Cases

### Test Case E.1: No Timetable Uploaded
**Test**: Test commands when timetable is not uploaded
**Commands to try**:
- "Check my schedule"
- "Check alerts"
- "Download PYQ for AI semester 5"

**Expected Result**: 
- Should handle gracefully
- Should provide helpful error messages
- Should suggest uploading timetable if needed

---

### Test Case E.2: No Internet Connection
**Test**: Test with poor/no internet
**Steps**:
1. Disconnect internet
2. Try various commands

**Expected Result**: 
- Should show appropriate error messages
- Should not crash
- Should suggest checking connection

---

### Test Case E.3: Microphone Permission Denied
**Test**: Test when microphone access is denied
**Steps**:
1. Deny microphone permission
2. Try to use SNEHA

**Expected Result**: 
- Should show clear error message
- Should explain how to enable permissions
- Should provide alternative (text input if available)

---

## Success Criteria

✅ **Phase 1 & 2**: All navigation and basic commands work correctly
✅ **Phase 3**: SRB and Policy queries return accurate answers
✅ **Phase 4**: Multi-turn conversations maintain context, proactive alerts appear automatically
✅ **Cross-Phase**: Commands work together seamlessly
✅ **Performance**: All commands respond within acceptable time
✅ **Edge Cases**: System handles errors gracefully

---

## Notes for Testing

1. **Browser Compatibility**: Test in Chrome, Edge, and Firefox (Speech Recognition support varies)
2. **Mobile Testing**: Test on mobile devices for PWA functionality
3. **Notification Permission**: Grant notification permission for full Phase 4 testing
4. **Timetable Setup**: Ensure timetable is uploaded before testing schedule-related features
5. **SRB & Policy**: Ensure Student Resource Book and Examination Policy documents are uploaded
6. **Voice Quality**: Use clear microphone and quiet environment for best results

---

## Quick Test Checklist

- [ ] Phase 1 & 2: Navigation commands work
- [ ] Phase 1 & 2: PYQ download works
- [ ] Phase 3: SRB queries return answers
- [ ] Phase 3: Policy queries return answers
- [ ] Phase 3: Speech recognition errors are handled
- [ ] Phase 4: Multi-turn conversations maintain context
- [ ] Phase 4: Proactive alerts appear automatically
- [ ] Phase 4: Browser notifications work
- [ ] Phase 4: Voice alert check works
- [ ] Cross-Phase: Mixed commands work together
- [ ] Edge Cases: Error handling works properly
