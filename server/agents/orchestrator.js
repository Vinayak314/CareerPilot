import { StateGraph, START, END, Annotation } from '@langchain/langgraph';
import { runAnalyzer } from './analyzerAgent.js';
import { runRewrites, runInterviewPrep } from './advisorAgent.js';

export const AgentState = Annotation.Root({
  resume: Annotation(),
  jobDescription: Annotation(),
  analysis: Annotation(),
  rewrites: Annotation({
    reducer: (state, update) => update,
    default: () => [],
  }),
  interviewQuestions: Annotation({
    reducer: (state, update) => update,
    default: () => [],
  }),
});

async function analyzeNode(state) {
  const analysis = await runAnalyzer({
    resume: state.resume,
    jobDescription: state.jobDescription,
  });
  return { analysis };
}

async function rewriteNode(state) {
  const weakBullets = state.analysis?.weakBullets || [];
  if (weakBullets.length === 0) {
    return { rewrites: [] };
  }
  const result = await runRewrites({
    resume: state.resume,
    jobDescription: state.jobDescription,
    weakBullets,
  });
  return { rewrites: result.rewrites };
}

async function interviewNode(state) {
  const result = await runInterviewPrep({
    resume: state.resume,
    jobDescription: state.jobDescription,
    analysis: state.analysis,
  });
  return { interviewQuestions: result.questions };
}

function routeAfterAnalysis(state) {
  // Analysis must succeed with Gemini before the advisor tasks run.
  return ['rewriteNode', 'interviewNode'];
}

export const createOrchestrator = () => {
  const graph = new StateGraph(AgentState)
    .addNode('analyzeNode', analyzeNode)
    .addNode('rewriteNode', rewriteNode)
    .addNode('interviewNode', interviewNode)
    
    .addEdge(START, 'analyzeNode')
    .addConditionalEdges('analyzeNode', routeAfterAnalysis, {
      rewriteNode: 'rewriteNode',
      interviewNode: 'interviewNode',
      [END]: END,
    })
    // Fan-in: wait for both parallel branches to complete before ending
    .addEdge('rewriteNode', END)
    .addEdge('interviewNode', END);

  return graph.compile();
};

export const runFullOrchestration = async (resume, jobDescription) => {
  const app = createOrchestrator();
  const initialState = {
    resume,
    jobDescription,
  };
  
  const finalState = await app.invoke(initialState);
  return {
    analysis: finalState.analysis,
    rewrites: finalState.rewrites,
    interviewQuestions: finalState.interviewQuestions,
  };
};
