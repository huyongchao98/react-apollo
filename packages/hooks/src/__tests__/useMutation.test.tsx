import React, { useEffect } from 'react';
import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';
import { MockedProvider, mockSingleLink } from '@apollo/react-testing';
import { render, cleanup, wait } from '@testing-library/react';
import { ApolloProvider, useMutation,MutationHookOptions } from '@apollo/react-hooks';
import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';


describe('useMutation Hook', () => {
  interface Todo {
    id: number;
    description: string;
    priority: string;
  }


 const isObjectValueEqual = (a:any, b:any) =>{
     const aProps = Object.getOwnPropertyNames(a);
     const bProps = Object.getOwnPropertyNames(b);
      if (aProps.length != bProps.length) {
           return false;
      }
      for (let i = 0; i < aProps.length; i++) {
        const propName = aProps[i]

        const propA = a[propName]
        const propB = b[propName]
        if ((typeof (propA) === 'object')) {
          if (isObjectValueEqual(propA, propB)) {
              return true
            } else {
              return false
            }
        } else if (propA !== propB) {
          return false
        } else { }
      }
    return true
  }

  const CREATE_TODO_MUTATION: DocumentNode = gql`
    mutation createTodo($description: String!) {
      createTodo(description: $description) {
        id
        description
        priority
      }
    }
  `;

  const CREATE_TODO_RESULT = {
    createTodo: {
      id: 1,
      description: 'Get milk!',
      priority: 'High',
      __typename: 'Todo'
    }
  };


    const CREATE_TODO_RESULT_2 = {
    createTodo: {
      id: 2,
      description: 'Get milk two!',
      priority: 'High',
      __typename: 'Todo'
    }
  };

  afterEach(cleanup);
  

  describe('General use', () => {
    it('should handle a simple mutation properly', done => {
      const variables = {
        description: 'Get milk!'
      };

      const mocks = [
        {
          request: {
            query: CREATE_TODO_MUTATION,
            variables
          },
          result: { data: CREATE_TODO_RESULT }
        }
      ];

      let renderCount = 0;
      const Component = () => {
        const [createTodo, { loading, data }] = useMutation(
          CREATE_TODO_MUTATION
        );
        switch (renderCount) {
          case 0:
            expect(loading).toBeFalsy();
            expect(data).toBeUndefined();
            createTodo({ variables });
            break;
          case 1:
            expect(loading).toBeTruthy();
            expect(data).toBeUndefined();
            break;
          case 2:
            expect(loading).toBeFalsy();
            expect(data).toEqual(CREATE_TODO_RESULT);
            done();
            break;
          default:
        }
        renderCount += 1;
        return null;
      };

      render(
        <MockedProvider mocks={mocks}>
          <Component />
        </MockedProvider>
      );
    });

    it('should be able to call mutations as an effect', done => {
      const variables = {
        description: 'Get milk!'
      };

      const mocks = [
        {
          request: {
            query: CREATE_TODO_MUTATION,
            variables
          },
          result: { data: CREATE_TODO_RESULT }
        }
      ];

      let renderCount = 0;
      const useCreateTodo = () => {
        const [createTodo, { loading, data }] = useMutation(
          CREATE_TODO_MUTATION
        );

        useEffect(() => {
          createTodo({ variables });
        }, [variables]);

        switch (renderCount) {
          case 0:
            expect(loading).toBeFalsy();
            expect(data).toBeUndefined();
            break;
          case 1:
            expect(loading).toBeTruthy();
            expect(data).toBeUndefined();
            break;
          case 2:
            expect(loading).toBeFalsy();
            expect(data).toEqual(CREATE_TODO_RESULT);
            done();
            break;
          default:
        }
        renderCount += 1;
        return null;
      };

      const Component = () => {
        useCreateTodo();
        return null;
      };

      render(
        <MockedProvider mocks={mocks}>
          <Component />
        </MockedProvider>
      );
    });

    it('should return context when send a request',done => {
 const variables = {
        description: 'Get milk!'
      };

      const mocks = [
        {
          request: {
            query: CREATE_TODO_MUTATION,
            variables
          },
          result: { data: CREATE_TODO_RESULT }
        }
      ];

      let mutationFn: any;
      let renderCount = 0;
      const Component = () => {
        const [createTodo, { context,loading, data }] = useMutation(
          CREATE_TODO_MUTATION
        );
        switch (renderCount) {
          case 0:
            mutationFn = createTodo;
            expect(loading).toBeFalsy();
            expect(data).toBeUndefined();
            expect(context).toBeUndefined();
            setTimeout(() => {
              createTodo({ variables });
            });
            break;
          case 1:{
            expect(mutationFn).toBe(createTodo);
            expect(loading).toBeTruthy();
            expect(data).toBeUndefined();
            const {mutationId,options} = context;
            expect(mutationId).not.toBeUndefined();
            expect(options).not.toBeUndefined();
            const {variables:theVariables} = options;
            expect(theVariables).not.toBeUndefined();
            const {description} = theVariables;
            expect(description).toEqual('Get milk!');
          }
            break;
          case 2:
            expect(loading).toBeFalsy();
            expect(data).toEqual(CREATE_TODO_RESULT);
            done();
            break;
          default:
        }
        renderCount += 1;
        return null;
      };

      render(
        <MockedProvider mocks={mocks}>
          <Component />
        </MockedProvider>
      );
    });


     it('should return two context when send two asynchronous request',done => {
      const variables = {
        description: 'Get milk!'
      };

       const variables2 = {
        description: 'Get milk two!'
      };

      const mocks = [
        {
          request: {
            query: CREATE_TODO_MUTATION,
            variables
          },
          result: { data: CREATE_TODO_RESULT }
        }
        ,
          {
          request: {
            query: CREATE_TODO_MUTATION,
            variables:variables2
          },
          result: { data: CREATE_TODO_RESULT_2 }
        }
      ];

      let mutationFn: any;
      let renderCount = 0;
      let matchCount = 0;
      let resultCount = 0;
      let options:MutationHookOptions<any,any>= {
        returnResultAlways:true
      }  as MutationHookOptions;
      
      const Component = () => {
        const [createTodo, { context,loading, data }] = useMutation(
          CREATE_TODO_MUTATION,
          options
        );

        const createTodos = [()=>createTodo({ variables })
        ,()=>createTodo({ variables:variables2 })
        ];
        switch (renderCount) {
          case 0:
            mutationFn = createTodo;
            expect(loading).toBeFalsy();
            expect(data).toBeUndefined();
            expect(context).toBeUndefined();
            setTimeout(() => {
              createTodos.map(async item => {
               item();
              });
            });
            break;
         case 1: 
          case 2:
          case 3:
          case 4:{
            if(loading){
            expect(mutationFn).toBe(createTodo);
            expect(data).toBeUndefined();
            const {mutationId,options} = context;
            expect(mutationId).not.toBeUndefined();
            expect(options).not.toBeUndefined();
            const {variables:theVariables} = options;
            expect(theVariables).not.toBeUndefined();
            const {description} = theVariables;
            if(description === 'Get milk!'){
              matchCount += 1;
            } else if(description === 'Get milk two!'){
              matchCount += 1;
            }
          }else{
              expect(loading).toBeFalsy();
              if(isObjectValueEqual(data,CREATE_TODO_RESULT_2)){
                resultCount += 1;
              } else if(isObjectValueEqual(data,CREATE_TODO_RESULT)){
                resultCount += 1;
              }
           }
          }
          default:
        }
        renderCount += 1;
        if(renderCount === 5){
          expect(matchCount).toBe(2);
          expect(resultCount).toBe(2);
          done();
        }
        return null;
      };
      
      render(
        <MockedProvider mocks={mocks}>
          <Component />
        </MockedProvider>
      );
    });

    it('should ensure the mutation callback function has a stable identity', done => {
      const variables = {
        description: 'Get milk!'
      };

      const mocks = [
        {
          request: {
            query: CREATE_TODO_MUTATION,
            variables
          },
          result: { data: CREATE_TODO_RESULT }
        }
      ];

      let mutationFn: any;
      let renderCount = 0;
      const Component = () => {
        const [createTodo, { loading, data }] = useMutation(
          CREATE_TODO_MUTATION
        );
        switch (renderCount) {
          case 0:
            mutationFn = createTodo;
            expect(loading).toBeFalsy();
            expect(data).toBeUndefined();
            setTimeout(() => {
              createTodo({ variables });
            });
            break;
          case 1:
            expect(mutationFn).toBe(createTodo);
            expect(loading).toBeTruthy();
            expect(data).toBeUndefined();
            break;
          case 2:
            expect(loading).toBeFalsy();
            expect(data).toEqual(CREATE_TODO_RESULT);
            done();
            break;
          default:
        }
        renderCount += 1;
        return null;
      };

      render(
        <MockedProvider mocks={mocks}>
          <Component />
        </MockedProvider>
      );
    });

    it('should resolve mutate function promise with mutation results', done => {
      const variables = {
        description: 'Get milk!'
      };

      const mocks = [
        {
          request: {
            query: CREATE_TODO_MUTATION,
            variables
          },
          result: { data: CREATE_TODO_RESULT }
        }
      ];

      const Component = () => {
        const [createTodo] = useMutation<{ createTodo: Todo }>(
          CREATE_TODO_MUTATION
        );

        async function doIt() {
          const { data } = await createTodo({ variables });
          expect(data).toEqual(CREATE_TODO_RESULT);
          expect(data!.createTodo.description).toEqual(
            CREATE_TODO_RESULT.createTodo.description
          );
          done();
        }

        useEffect(() => {
          doIt();
        }, []);

        return null;
      };

      render(
        <MockedProvider mocks={mocks}>
          <Component />
        </MockedProvider>
      );
    });

    it('should return the current client instance in the result object', async () => {
      const Component = () => {
        const [, { client }] = useMutation(CREATE_TODO_MUTATION);
        expect(client).toBeDefined();
        expect(client instanceof ApolloClient).toBeTruthy();
        return null;
      };

      render(
        <MockedProvider>
          <Component />
        </MockedProvider>
      );

      await wait();
    });
  });

  describe('Optimistic response', () => {
    it('should support optimistic response handling', done => {
      const optimisticResponse = {
        __typename: 'Mutation',
        createTodo: {
          id: 1,
          description: 'TEMPORARY',
          priority: 'High',
          __typename: 'Todo'
        }
      };

      const variables = {
        description: 'Get milk!'
      };

      const mocks = [
        {
          request: {
            query: CREATE_TODO_MUTATION,
            variables
          },
          result: { data: CREATE_TODO_RESULT }
        }
      ];

      const link = mockSingleLink(...mocks);
      const cache = new InMemoryCache();
      const client = new ApolloClient({
        cache,
        link
      });

      let renderCount = 0;
      const Component = () => {
        const [createTodo, { loading, data }] = useMutation(
          CREATE_TODO_MUTATION,
          { optimisticResponse }
        );

        switch (renderCount) {
          case 0:
            expect(loading).toBeFalsy();
            expect(data).toBeUndefined();
            createTodo({ variables });

            const dataInStore = client.cache.extract(true);
            expect(dataInStore['Todo:1']).toEqual(
              optimisticResponse.createTodo
            );

            break;
          case 1:
            expect(loading).toBeTruthy();
            expect(data).toBeUndefined();
            break;
          case 2:
            expect(loading).toBeFalsy();
            expect(data).toEqual(CREATE_TODO_RESULT);
            done();
            break;
          default:
        }
        renderCount += 1;
        return null;
      };

      render(
        <ApolloProvider client={client}>
          <Component />
        </ApolloProvider>
      );
    });
  });
});
