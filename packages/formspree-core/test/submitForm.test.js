import { createClient } from '../src';
import { hasErrors, isKnownError } from '../src/forms';
import { version } from '../package.json';

// A fake success result for a mocked `fetch` call.
//
// Example:
//
//   const mockFetch = (_url, props) => {
//     return success;
//   };
//
const success = new Promise((resolve, _reject) => {
  const response = {
    status: 200,
    json: () => {
      return new Promise(resolve => {
        resolve({ id: 'xxx' });
      });
    }
  };
  resolve(response);
});

const failure = new Promise((resolve, _reject) => {
  const response = {
    status: 400,
    json: () => {
      return new Promise(resolve => {
        resolve({
          errors: [{ code: 'UNKNOWN', message: 'doh!' }]
        });
      });
    }
  };
  resolve(response);
});

it('resolves with body and response when successful', () => {
  const mockFetch = (url, props) => {
    expect(props.method).toEqual('POST');
    expect(props.mode).toEqual('cors');
    expect(/^https:\/\/.+\/p\/111\/f\/newsletter$/.test(url)).toEqual(true);
    return success;
  };

  return createClient({ project: '111' })
    .submitForm(
      'newsletter',
      {},
      {
        fetchImpl: mockFetch
      }
    )
    .then(({ body, response }) => {
      expect(body.id).toEqual('xxx');
      expect(response.status).toEqual(200);
    })
    .catch(e => {
      throw e;
    });
});

it('uses the form URL when no project key is provided', () => {
  const mockFetch = (url, props) => {
    expect(props.method).toEqual('POST');
    expect(props.mode).toEqual('cors');
    expect(/^https:\/\/.+\/f\/xxyyhashid$/.test(url)).toEqual(true);
    return success;
  };

  return createClient()
    .submitForm(
      'xxyyhashid',
      {},
      {
        fetchImpl: mockFetch
      }
    )
    .then(({ body, response }) => {
      expect(body.id).toEqual('xxx');
      expect(response.status).toEqual(200);
    })
    .catch(e => {
      throw e;
    });
});

it('handles errors returned from the server', () => {
  const mockFetch = () => {
    return failure;
  };

  return createClient()
    .submitForm(
      'xxyyhashid',
      {},
      {
        fetchImpl: mockFetch
      }
    )
    .then(({ body, response }) => {
      expect(response.status).toEqual(400);
      expect(hasErrors(body)).toEqual(true);
      expect(isKnownError(body.errors[0])).toEqual(false);
    })
    .catch(e => {
      throw e;
    });
});

it('uses a default client header if none is given', () => {
  const mockFetch = (_url, props) => {
    expect(props.headers['Formspree-Client']).toEqual(
      `@formspree/core@${version}`
    );

    return success;
  };

  return createClient({ project: '111' }).submitForm(
    'newsletter',
    {},
    {
      fetchImpl: mockFetch
    }
  );
});

it('puts given client name in the client header', () => {
  const mockFetch = (_url, props) => {
    expect(props.headers['Formspree-Client']).toEqual(
      `my-client @formspree/core@${version}`
    );

    return success;
  };

  return createClient({ project: '111' }).submitForm(
    'newsletter',
    {},
    {
      clientName: 'my-client',
      fetchImpl: mockFetch
    }
  );
});

it('sets content type to json if data is not FormData', () => {
  const mockFetch = (_url, props) => {
    expect(props.headers['Content-Type']).toEqual('application/json');

    const parsedBody = JSON.parse(props.body);
    expect(parsedBody.foo).toEqual('bar');
    return success;
  };

  return createClient({ project: '111' }).submitForm(
    'newsletter',
    { foo: 'bar' },
    { fetchImpl: mockFetch }
  );
});

it('sends telemetry data if session is started', () => {
  const mockFetch = (_url, props) => {
    expect(props.headers['Content-Type']).toEqual('application/json');
    expect(props.headers['Formspree-Session-Data']).toBeDefined();

    const parsedBody = JSON.parse(props.body);
    return success;
  };

  const client = createClient({ project: '111' });
  client.startBrowserSession();
  return client.submitForm('newsletter', {}, { fetchImpl: mockFetch });
});
