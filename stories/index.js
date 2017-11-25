import React from 'react';
import { storiesOf } from '@storybook/react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import {
  combineValidators,
  composeValidators,
  isRequired,
  isAlphabetic,
  isNumeric,
} from 'revalidate';
import { compose, withProps } from 'recompose';
import FormSchema from '../src/Schema';
import createForm from '../src/withForm';
import withValidationMessage from '../src/withValidationMessage';
import withInput from '../src/withInput';

function SubmitControls() {
  return <button type="submit">Submit</button>;
}

storiesOf('Forms', module)
  .add('Simple Example', () => {
    const sampleMutation = gql`
      mutation($inputData: PersonInput) {
        createSample(inputData: $inputData)
      }
    `;

    const Form = createForm({ mutation: sampleMutation })('form');
    const Input = compose(withInput, withValidationMessage)('input');

    const sampleValidator = combineValidators({
      name: composeValidators(isRequired, isAlphabetic)('Name'),
      age: composeValidators(isRequired, isNumeric)('Age'),
    });

    const Schema = new FormSchema({
      model: {
        name: null,
        age: null,
      },
      validator: sampleValidator,
    });

    const query = gql`
      {
        sampleForm @client {
          name
          age
        }
      }
    `;
    return (
      <Form
        onSuccess={() => {
          return alert('Submitted!');
        }}
        onError={() => {
          alert('ERRORED');
        }}
        onErrorMessage={(errorMessage) => {
          const errorKeys = Object.keys(errorMessage);
          errorKeys &&
            errorKeys.length > 0 &&
            alert(errorMessage[errorKeys[0]]);
        }}
        formName="sampleForm"
        schema={Schema}
        inputQuery={query}
      >
        <Input field="name" />
        <Input type="number" field="age" />
        <SubmitControls />
      </Form>
    );
  })
  .add('Hydrating Form', () => {
    const sampleMutation = gql`
      mutation($inputData: PersonInput) {
        createSample(inputData: $inputData)
      }
    `;

    const inputQuery = gql`
      {
        sampleForm @client {
          name
          age
        }
      }
    `;

    const hydrationQuery = gql`
      query sample {
        sampleForm {
          name
          age
        }
      }
    `;

    let FormFetcher = function FormFetcher({ loading, children, data }) {
      if (loading) {
        return null;
      }
      return children(data);
    };

    FormFetcher = compose(
      graphql(hydrationQuery),
      withProps(({ data }) => {
        return {
          data: data && data.sampleForm,
          loading: data && data.loading,
        };
      })
    )(FormFetcher);

    const Form = compose(
      withProps(({ data }) => {
        const sampleValidator = combineValidators({
          name: composeValidators(isRequired, isAlphabetic)('Name'),
          age: composeValidators(isRequired, isNumeric)('Age'),
        });

        const Schema = new FormSchema({
          model: data,
          validator: sampleValidator,
        });

        return {
          schema: Schema,
        };
      }),
      createForm({ mutation: sampleMutation })
    )('form');

    const Input = compose(withInput, withValidationMessage)('input');

    return (
      <FormFetcher>
        {(data) => {
          return (
            <Form
              initialData={data}
              onSuccess={() => {
                return alert('Submitted!');
              }}
              onError={() => {
                alert('ERRORED');
              }}
              onErrorMessage={(errorMessage) => {
                const errorKeys = Object.keys(errorMessage);
                errorKeys &&
                  errorKeys.length > 0 &&
                  alert(errorMessage[errorKeys[0]]);
              }}
              formName="sampleForm"
              inputQuery={inputQuery}
            >
              <Input field="name" />
              <Input type="number" field="age" />
              <SubmitControls />
            </Form>
          );
        }}
      </FormFetcher>
    );
  });