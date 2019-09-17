import { useContext, useState, useRef, useEffect } from 'react';
import { getApolloContext, OperationVariables } from '@apollo/react-common';
import { DocumentNode } from 'graphql';

import { MutationHookOptions, MutationTuple } from './types';
import { MutationData } from './data/MutationData';

export function useMutation<TData = any, TVariables = OperationVariables>(
  mutation: DocumentNode,
  options?: MutationHookOptions<TData, TVariables>
): MutationTuple<TData, TVariables> {
  const context = useContext(getApolloContext());
  const [result, setResult] = useState({ called: false, loading: false });
  const updatedOptions = options ? { ...options, mutation } : { mutation };
  const returnResultAlways = options && options.returnResultAlways  ? options.returnResultAlways : false;

  const mutationDataRef = useRef<MutationData<TData, TVariables>>();
  function getMutationDataRef() {
    if (!mutationDataRef.current) {
      mutationDataRef.current = new MutationData<TData, TVariables>({
        options: updatedOptions,
        context,
        result,
        setResult,
        returnResultAlways
      });
    }
    return mutationDataRef.current;
  }

  const mutationData = getMutationDataRef();
  mutationData.setOptions(updatedOptions);
  mutationData.context = context;

  useEffect(() => mutationData.afterExecute());

  return mutationData.execute(result);
}
