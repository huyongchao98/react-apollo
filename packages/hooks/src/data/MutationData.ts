import { ApolloError } from 'apollo-client';
import { equal as isEqual } from '@wry/equality';
import {
  ApolloContextValue,
  DocumentType,
  OperationVariables,
  ExecutionResult,
  MutationFunctionOptions,
  MutationResult
} from '@apollo/react-common';

import { MutationOptions, MutationTuple } from '../types';
import { OperationData } from './OperationData';


interface Context <
  TData = any,
  TVariables = OperationVariables
> {
  mutationId:number,
  options:MutationFunctionOptions<
      TData,
      TVariables
    >
}

export class MutationData<
  TData = any,
  TVariables = OperationVariables
> extends OperationData {
  private mostRecentMutationId: number;
  private result: MutationResult<TData>;
  private previousResult?: MutationResult<TData>;
  private setResult: (result: MutationResult<TData>) => any;
  private returnResultAlways: boolean;

  constructor({
    options,
    context,
    result,
    setResult,
    returnResultAlways
  }: {
    options: MutationOptions<TData, TVariables>;
    context: ApolloContextValue;
    result: MutationResult<TData>;
    setResult: (result: MutationResult<TData>) => any;
    returnResultAlways:boolean;
  }) {
    super(options, context);
    this.verifyDocumentType(options.mutation, DocumentType.Mutation);
    this.result = result;
    this.setResult = setResult;
    this.mostRecentMutationId = 0;
    this.returnResultAlways = returnResultAlways;
  }

  public execute(result: MutationResult<TData>) {
    this.isMounted = true;
    this.verifyDocumentType(this.getOptions().mutation, DocumentType.Mutation);
    result.client = this.refreshClient().client;
    return [this.runMutation, result] as MutationTuple<TData, TVariables>;
  }

  public afterExecute() {
    this.isMounted = true;
    return this.unmount.bind(this);
  }

  public cleanup() {
    // No cleanup required.
  }

  private runMutation = (
    mutationFunctionOptions: MutationFunctionOptions<
      TData,
      TVariables
    > = {} as MutationFunctionOptions<TData, TVariables>
  ) => {
    
    const mutationId = this.generateNewMutationId();
    const theContext= {mutationId,options:mutationFunctionOptions}
    this.onMutationStart(theContext);

    return this.mutate(mutationFunctionOptions)
      .then((response: ExecutionResult<TData>) => {
        this.onMutationCompleted(response, mutationId);
        return response;
      })
      .catch((error: ApolloError) => {
        this.onMutationError(error, mutationId,theContext);
        if (!this.getOptions().onError) throw error;
      });
  };

  private mutate(
    mutationFunctionOptions: MutationFunctionOptions<TData, TVariables>
  ) {
    const {
      mutation,
      variables,
      optimisticResponse,
      update,
      context: mutationContext = {},
      awaitRefetchQueries = false,
      fetchPolicy
    } = this.getOptions();
    const mutateOptions = { ...mutationFunctionOptions };

    const mutateVariables = Object.assign(
      {},
      variables,
      mutateOptions.variables
    );
    delete mutateOptions.variables;

    return this.refreshClient().client.mutate({
      mutation,
      optimisticResponse,
      refetchQueries:
        mutateOptions.refetchQueries || this.getOptions().refetchQueries,
      awaitRefetchQueries,
      update,
      context: mutationContext,
      fetchPolicy,
      variables: mutateVariables,
      ...mutateOptions
    });
  }

  private onMutationStart(context:Context) {
    if (!this.result.loading && !this.getOptions().ignoreResults) {
      this.updateResult({
        loading: true,
        context,
        error: undefined,
        data: undefined,
        called: true
      });
    }
  }

  private onMutationCompleted(
    response: ExecutionResult<TData>,
    mutationId: number
  ) {
    const { onCompleted, ignoreResults } = this.getOptions();

    const { data, errors } = response;
    const error =
      errors && errors.length > 0
        ? new ApolloError({ graphQLErrors: errors })
        : undefined;

    const callOncomplete = () =>
      onCompleted ? onCompleted(data as TData) : null;

    if (this.returnResultAlways || this.isMostRecentMutation(mutationId) && !ignoreResults) {
      this.updateResult({
        called: true,
        loading: false,
        data,
        error
      });
    }
    callOncomplete();
  }

  private onMutationError(error: ApolloError, mutationId: number, context:Context) {
    const { onError } = this.getOptions();

    if (this.returnResultAlways || this.isMostRecentMutation(mutationId)) {
      this.updateResult({
        loading: false,
        error,
        data: undefined,
        called: true
      });
    }

    if (onError) {
      onError(error,context);
    }
  }

  private generateNewMutationId(): number {
    return ++this.mostRecentMutationId;
  }

  private isMostRecentMutation(mutationId: number) {
    return this.mostRecentMutationId === mutationId;
  }

  private updateResult(result: MutationResult<TData>) {
    if (
      this.isMounted &&
      (!this.previousResult || !isEqual(this.previousResult, result))
    ) {
      this.setResult(result);
      this.previousResult = result;
    }
  }
}
