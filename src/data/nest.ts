import type { Guide, Line, NestLineId } from '../engine/types';

/**
 * The NestJS division: the backend half of the job, drilled as questions.
 * Checked against the NestJS docs (request lifecycle, validation, scopes).
 */
export const NEST_LINES: Line[] = [
  {
    id: 'life',
    division: 'nest',
    kind: 'flow',
    bullet: '1',
    color: '--red',
    short: 'Lifecycle',
    name: 'Main Line',
    topic: 'Request lifecycle',
    pitch: 'Every NestJS interview asks some version of "what happens when a request comes in?" This is that question, as a train ride.',
    rules: [
      'Click the stages in the exact order they run.',
      'Some requests never reach the handler. Follow where the request actually goes.',
      'On the way out, the order reverses.',
    ],
    hook: 'Middleware → Guards → Interceptors (before) → Pipes → Handler → Service → Interceptors (after) → Response. If anything throws, an exception filter builds the response instead.',
    drill: 'Think of it as two trips. On the way in, each layer can stop the request. They go from general to specific. The first layer does not even know which handler will run yet. The last one checks a single argument. Then your code runs. On the way out, only the layers that wrapped your code get another turn. If something threw, the error is turned into a response last.',
    par: 95,
    flows: [
      {
        t: 1,
        title: 'POST /users with a valid body, nothing blocks it',
        steps: [
          'Middleware',
          'Guard',
          'Interceptor (before)',
          'Pipe / ValidationPipe',
          'Route handler',
          'Service',
          'Interceptor (after)',
          'Response sent',
        ],
        decoys: ['Exception filter'],
        note: 'The full happy path. The interceptor shows up twice, once on the way in and once on the way out. Nothing threw, so no exception filter runs.',
      },
      {
        t: 1,
        title: 'GET /admin, and the auth guard returns false',
        steps: ['Middleware', 'Guard', 'Exception filter', 'Response sent'],
        decoys: ['Interceptor (before)', 'Pipe / ValidationPipe', 'Route handler'],
        note: 'A guard that returns false stops everything after it. The interceptor, the pipes and the handler never run. Nest turns the false into a ForbiddenException, and the exception filter sends it back as a 403.',
      },
      {
        t: 1,
        title: 'POST /users where the body fails validation',
        start: 2,
        steps: [
          'Middleware',
          'Guard',
          'Interceptor (before)',
          'Pipe / ValidationPipe',
          'Exception filter',
          'Response sent',
        ],
        decoys: ['Route handler', 'Service'],
        note: 'The guard already said yes, and the interceptor already started. Then ValidationPipe throws a BadRequestException. That goes straight to the exception filter, which sends a 400. Your handler never sees the bad body.',
      },
      {
        t: 1,
        title: 'GET /posts/42. No guard anywhere. The app has a logging middleware, a global interceptor, and ParseIntPipe on :id',
        steps: [
          'Middleware',
          'Interceptor (before)',
          'Pipe / ParseIntPipe',
          'Route handler',
          'Service',
          'Interceptor (after)',
          'Response sent',
        ],
        decoys: ['Guard'],
        note: 'Nothing is skipped here. This app has no guard, so there is no guard step. The lifecycle is only the pieces you attached, not a fixed list of stages.',
      },
      {
        t: 1,
        title: 'A rate limiter in middleware answers the request itself and never calls next()',
        steps: ['Middleware', 'Response sent'],
        decoys: ['Guard', 'Interceptor (before)', 'Pipe / ValidationPipe', 'Route handler', 'Exception filter'],
        note: 'On the default Express adapter, middleware gets Express\'s plain req, res and next. If it sends the response and never calls next(), Nest never gets the request. So no guard, interceptor or exception filter sees it. Fine for a rate limit. Bad for anything you want an interceptor to log.',
      },
      {
        t: 2,
        title: 'GET /users/7, the service throws NotFoundException',
        start: 4,
        steps: [
          'Middleware',
          'Guard',
          'Interceptor (before)',
          'Pipe / ValidationPipe',
          'Route handler',
          'Service',
          'Exception filter',
          'Response sent',
        ],
        decoys: ['Interceptor (after)'],
        note: 'The service throws after the handler started. The error skips the rest of the trip, including the interceptor\'s normal after step, and goes to the exception filter, which sends a 404. Because errors from anywhere end up there, a service can just throw. It never needs to touch res.status. An interceptor sees the error only if it listens for it, with catchError or the error callback of tap. finalize() also runs when something throws, but it does not get the error.',
      },
      {
        t: 2,
        title: 'Three guards on one route: one global, one on the controller, one on the route',
        steps: ['Global guard', 'Controller guard', 'Route guard'],
        decoys: ['Module guard', 'Param guard'],
        note: 'On the way in, guards always run global first, then controller, then route. Interceptors follow the same order. Pipes have a fourth level, on a single parameter, which runs last. There is no guard for just one module. A module can register a guard with APP_GUARD, but that makes it global. It then runs on every route in the app, even routes that never mention it.',
      },
      {
        t: 2,
        title: 'The global guard passes and the route guard returns false',
        steps: ['Global guard', 'Route guard', 'Exception filter', 'Response sent'],
        decoys: ['Controller guard', 'Route handler', 'Interceptor (after)'],
        note: 'Guards run from global to route, and the first false ends it. Passing the global guard only got the request as far as the route guard, which said no. There is no controller guard on this route, so none runs. Nest turns the false into a 403, and the exception filter sends it.',
      },
      {
        t: 2,
        title: 'The handler returned. Three interceptors are waiting on the way out',
        steps: [
          'Route interceptor',
          'Controller interceptor',
          'Global interceptor',
          'Response sent',
        ],
        decoys: ['Exception filter'],
        note: 'On the way out, the order reverses. The route interceptor finishes first. The global one finishes last, because it wraps all the others.',
      },
      {
        t: 3,
        title: 'Full run: global and module middleware, a global and a route guard, global and route interceptors, a global pipe and a param pipe',
        steps: [
          'Global middleware',
          'Module middleware',
          'Global guard',
          'Route guard',
          'Global interceptor (before)',
          'Route interceptor (before)',
          'Global pipe',
          'Route param pipe',
          'Route handler',
          'Service',
          'Route interceptor (after)',
          'Global interceptor (after)',
          'Response sent',
        ],
        decoys: ['Exception filter'],
        note: 'That is the whole thing. On the way in, each kind goes from global to specific. On the way out, the interceptors go from specific to global.',
      },
    ],
  },
  {
    id: 'di',
    division: 'nest',
    kind: 'quiz',
    bullet: '2',
    color: '--blue',
    short: 'DI & modules',
    name: 'Wiring Yard',
    topic: 'Dependency injection and modules',
    pitch: "\"Nest can't resolve dependencies of the OrdersService (?)\" is the error you will hit most, and the one they love to ask about. It almost always means one of three lines is missing: providers, exports or imports.",
    rules: [
      'Read the modules, then answer the question about them.',
      'Think: is it provided, is it exported, is the module imported?',
      'Wrong answers still show you why.',
    ],
    hook: 'A module\'s providers are private. exports makes one public. imports is how another module asks for it. All three have to line up.',
    par: 110,
    drill: 'Ask who needs it and where it comes from. Does this module build it? Should other modules get it too? Does this module need it from somewhere else? Does it answer HTTP requests?',
    sorts: [
      {
        t: 1,
        title: 'You are writing OrdersModule. Which part of @Module() does each one go in?',
        buckets: ['imports', 'controllers', 'providers', 'exports'],
        items: [
          { name: 'UsersModule, so you can inject UsersService here', bucket: 'imports', why: 'You get another module\'s exported providers by importing that module. Listing UsersService yourself would make a second, separate instance.' },
          { name: 'TypeOrmModule.forFeature([Order])', bucket: 'imports', why: 'forFeature([Order]) is a function call that returns a module. That module provides the Order repository. Modules always go in imports, even ones a function builds.' },
          { name: 'The class that answers GET /orders', bucket: 'controllers', why: 'Nest only looks for routes in the classes listed in controllers. Put it anywhere else and its routes are never registered, so requests get a 404.' },
          { name: 'OrdersService, so this module can inject it', bucket: 'providers', why: 'providers is the list of things Nest can build for this module. Without it, nothing here can ask for OrdersService.' },
          { name: 'A pricing helper nothing outside this module uses', bucket: 'providers', why: 'Providers are private to their module by default. That is what you want for a helper. Export only what another module needs.' },
          { name: 'OrdersService, so ShippingModule can inject it too', bucket: 'exports', why: 'It stays in providers. Listing it in exports too is what lets any module that imports this one inject it.' },
        ],
        note: 'providers is what this module can build. exports is the part of providers other modules may use. imports is how this module gets someone else\'s exports. controllers is where the routes live. "Nest can\'t resolve dependencies" almost always means providers, exports or imports is missing a line. A missing controller never causes it. Its routes just return 404.',
      },
    ],
    flows: [
      {
        t: 1,
        title: 'The app boots. OrdersController needs OrdersService, which needs UsersService from UsersModule',
        steps: [
          'Start at AppModule',
          'Follow imports to every module',
          'Read constructor types from metadata',
          'Find UsersService in UsersModule exports',
          'Build UsersService',
          'Build OrdersService with it',
          'Build OrdersController with that',
          'Start listening for requests',
        ],
        decoys: ['Scan src/ for @Injectable classes', 'Give OrdersModule its own UsersService'],
        note: 'Nest never scans your folders. It starts at the root module you pass to NestFactory.create() and follows imports from there. A class no module lists does not exist to Nest. To learn what each constructor needs, Nest reads the type info TypeScript saved at compile time. It builds each dependency before the class that needs it. Each provider is built once and shared, so OrdersModule gets the same UsersService that UsersModule built.',
      },
    ],
    questions: [
      {
        t: 1,
        q: 'What does AppModule, the root module, do?',
        opts: [
          'It is where Nest starts building the app',
          'It shares its providers with every module',
          'It is the only module allowed controllers',
        ],
        a: 'It is where Nest starts building the app',
        why: 'NestFactory.create(AppModule) hands Nest the root module. Nest follows imports from there to find every other module. A module nothing imports is never loaded. Being the root does not share its providers with anyone, and any module can have controllers.',
      },
      {
        t: 1,
        q: 'UsersController is written, but no module lists it in controllers. What does GET /users return?',
        opts: [
          '404, because the route was never registered',
          '500, because Nest cannot build the controller',
          '200, because Nest finds every @Controller',
        ],
        a: '404, because the route was never registered',
        why: 'Nest only knows about classes a module lists. It does not scan your folders, so an unlisted controller\'s routes do not exist, and the request gets the default 404. It is not a 500, because Nest never tries to build a class it has never heard of. `nest g controller` adds the line for you, which is why it is easy to forget when you create the file by hand.',
      },
      {
        t: 1,
        q: 'The resolve error names UsersService at index [0] and says it has to be available in OrdersModule. Where do you look first?',
        opts: [
          'OrdersModule\'s imports, for who exports it',
          'UsersService\'s constructor, for what threw',
          'AppModule, to see if it imports OrdersModule',
        ],
        a: 'OrdersModule\'s imports, for who exports it',
        why: 'The error names the missing piece, UsersService, and the module that cannot see it, OrdersModule. So either OrdersModule does not import the module that has UsersService, or that module provides it without exporting it. Index [0] only means it was the first constructor argument. Nothing threw inside UsersService, since Nest never got far enough to build OrdersService.',
      },
      {
        t: 1,
        q: 'OrdersService injects UsersService. What happens when the app starts?',
        code: `@Module({ providers: [UsersService] })        // no exports
export class UsersModule {}

@Module({ imports: [UsersModule], providers: [OrdersService] })
export class OrdersModule {}`,
        opts: [
          "Nest can't resolve dependencies of OrdersService",
          'It works, because OrdersModule imports UsersModule',
          'It works, but Orders quietly gets a second copy',
        ],
        a: "Nest can't resolve dependencies of OrdersService",
        why: 'Importing a module only gives you what it exports. UsersModule provides UsersService but keeps it private. So OrdersModule cannot see it, and Nest stops at startup. The fix is exports: [UsersService] in UsersModule. There is no quiet second copy, because OrdersModule never listed UsersService itself.',
      },
      {
        t: 1,
        q: 'Same two services, but now UsersModule exports UsersService and OrdersModule has no imports. What happens?',
        code: `@Module({ providers: [UsersService], exports: [UsersService] })
export class UsersModule {}

@Module({ providers: [OrdersService] })   // imports: ???
export class OrdersModule {}`,
        opts: [
          'It fails. OrdersModule still has to import UsersModule',
          'It works, because exporting publishes it app-wide',
          'It works, since both modules live in the same app',
        ],
        a: 'It fails. OrdersModule still has to import UsersModule',
        why: 'Both halves are required. The owner exports it, and the consumer imports the owner. Exporting alone only makes it available to modules that import UsersModule. It does not publish it to the whole app.',
      },
      {
        t: 1,
        q: 'OrdersService takes UsersService in its constructor. What does OrdersService need so Nest can build it?',
        opts: [
          "@Injectable() on it, and listed in a module's providers",
          '@Injectable() on it, and exported from its own file',
          'A public constructor and no circular imports',
        ],
        a: "@Injectable() on it, and listed in a module's providers",
        why: 'providers tells a module to build the class. Putting a decorator on the class makes TypeScript record the constructor\'s parameter types, and @Injectable() is the one Nest uses. That record is how Nest knows to pass in UsersService. Leave providers out, and anything that injects OrdersService fails at startup. Leave @Injectable() out and the app still boots, but the dependency arrives as undefined and crashes on first use. Exporting from a file is plain TypeScript and means nothing to Nest.',
      },
      {
        t: 2,
        q: 'UsersService keeps an in-memory cache. Two modules both list it in providers. What is true?',
        code: `@Module({ providers: [UsersService] }) export class AModule {}
@Module({ providers: [UsersService] }) export class BModule {}`,
        opts: [
          'Each module gets its own instance, so the caches drift',
          'They share one instance, so the cache stays in sync',
          'Nest throws a duplicate provider error at startup',
        ],
        a: 'Each module gets its own instance, so the caches drift',
        why: 'Nest builds one instance per module that lists a provider, not one per app. Two modules list it here, so there are two instances with two separate caches. Nest does not treat that as an error. To fix it, provide it in one module, export it, and import that module everywhere else.',
      },
      {
        t: 2,
        q: 'You want ConfigService available in every module without importing ConfigModule 20 times. What do you do?',
        opts: [
          'Mark ConfigModule @Global() and export ConfigService',
          "Add ConfigService to every module's providers list",
          'Export ConfigService from AppModule to the whole app',
        ],
        a: 'Mark ConfigModule @Global() and export ConfigService',
        why: "@Global() lets every module use its exports without importing it. Two catches. The module still has to be imported once, usually in AppModule. And only what it exports is shared. Adding ConfigService to every providers list would build 20 separate copies, and AppModule's exports only reach modules that import AppModule. Use @Global() sparingly, since it hides where a dependency comes from.",
      },
      {
        t: 2,
        q: 'AuthService injects UsersService, and UsersService injects AuthService. How do you make that work?',
        opts: [
          'Wrap both references in forwardRef(() => Other)',
          'Mark both services @Global() so Nest can find them',
          'Register both in one module and drop the imports',
        ],
        a: 'Wrap both references in forwardRef(() => Other)',
        why: 'Each side injects the other with @Inject(forwardRef(() => UsersService)), and the same the other way around. forwardRef tells Nest to look the class up later, once both exist. @Global() and a shared module do not help, because each service still needs the other to be built first. Worth saying in an interview: a circle like this often means the two services split their jobs badly.',
      },
      {
        t: 2,
        q: 'UsersService is declared @Injectable({ scope: Scope.REQUEST }). UsersController injects it. What happens to the controller?',
        opts: [
          'The controller becomes request-scoped as well',
          'Only the service is rebuilt on each request',
          'Nest rejects it, because controllers are singletons',
        ],
        a: 'The controller becomes request-scoped as well',
        why: 'Request scope spreads upward. Anything that injects a request-scoped provider has to be rebuilt per request too, or it would keep one request\'s service forever. So the controller becomes request-scoped, and so does anything that injects it. That is the performance cost the docs warn about.',
      },
      {
        t: 2,
        q: 'In this unit test, what goes in the `/* ??? */` slot to swap the real UsersService for a fake?',
        code: `const moduleRef = await Test.createTestingModule({
  controllers: [UsersController],
  providers: [UsersService],
}) /* ??? */ .compile();`,
        opts: [
          '.overrideProvider(UsersService).useValue(fake)',
          '.overrideModule(UsersModule).useValue(fake)',
          '.useMocker((token) => fake)',
        ],
        a: '.overrideProvider(UsersService).useValue(fake)',
        why: 'overrideProvider picks one provider, and useValue says what to use instead. overrideModule swaps a whole module, and it offers useModule, not useValue. useMocker only fills dependencies nobody provided, and UsersService is provided, so the real one would still be used. That one-line swap is the payoff of DI.',
      },
      {
        t: 3,
        q: 'A provider is registered with a string token. How do you inject it?',
        code: "{ provide: 'STRIPE', useValue: new Stripe(key) }",
        opts: [
          "constructor(@Inject('STRIPE') private s: Stripe)",
          'constructor(private stripe: Stripe) as usual',
          "@Injectable('STRIPE') on the consuming class",
        ],
        a: "constructor(@Inject('STRIPE') private s: Stripe)",
        why: 'A token is the key Nest uses to find a provider. Usually it is the class itself, and Nest reads it from the constructor\'s type. Here the token is the string \'STRIPE\', and the Stripe type does not mention that string. So you name it with @Inject(\'STRIPE\'). @Injectable() does not take a token.',
      },
      {
        t: 3,
        q: 'What does the inject array do in a factory provider?',
        code: `{
  provide: 'DB',
  useFactory: (config: ConfigService) => createPool(config.url),
  inject: [ConfigService],
}`,
        opts: [
          'Lists the providers Nest passes into the factory',
          'Lists the providers the factory result exports',
          'Marks the listed providers as available app-wide',
        ],
        a: 'Lists the providers Nest passes into the factory',
        why: 'Nest resolves each provider in inject and passes them to the factory, in the same order. Here it calls the factory with ConfigService. Use useFactory with inject for anything that needs config or async setup before it can exist, like a database pool. inject has nothing to do with exports, and it does not make anything global.',
      },
      {
        t: 3,
        q: 'Why does NestJS need emitDecoratorMetadata turned on in tsconfig?',
        opts: [
          'So Nest can read constructor types at runtime',
          'So decorators are valid TypeScript syntax',
          'So the compiler keeps strict null checks on',
        ],
        a: 'So Nest can read constructor types at runtime',
        why: 'TypeScript deletes types when it compiles to JavaScript. With emitDecoratorMetadata on, it saves each decorated class\'s constructor parameter types. Nest reads those to know what to inject. The flag has nothing to do with whether decorators compile, or with strict null checks.',
      },
      {
        t: 2,
        q: 'A helper service is only used inside UsersModule. Should you export it?',
        opts: [
          'No. Export only what another module needs',
          'Yes. Exporting every provider is the default',
          'Only if the helper is marked @Injectable()',
        ],
        a: 'No. Export only what another module needs',
        why: "exports is your module's public API. Keep it small, so other modules can only reach what they actually need.",
      },
      {
        t: 1,
        q: 'What does a module\'s providers array do?',
        opts: [
          'Registers what Nest can build and inject',
          'Lists the routes this module answers on',
          'Shares its classes with every other module',
        ],
        a: 'Registers what Nest can build and inject',
        why: 'Providers are what the injector knows how to build: usually classes, but also plain values and factories. Routes come from controllers, and sharing with other modules is what exports is for.',
      },
      {
        t: 1,
        q: 'How do you get a UsersService inside UsersController?',
        opts: [
          'Declare it as a constructor parameter',
          'Call new UsersService() in the handler',
          'Import it and use UsersService.instance',
        ],
        a: 'Declare it as a constructor parameter',
        why: 'constructor(private readonly users: UsersService) {} is the whole thing. Nest reads the type, finds the provider and hands you the shared instance. Calling new yourself skips DI. You get a separate copy, you have to build its dependencies by hand, and a test cannot swap it for a fake. There is no static instance property either.',
      },
      {
        t: 1,
        q: 'What is the default lifetime of a provider?',
        opts: [
          'One instance, built once and reused',
          'A new instance for every incoming request',
          'A new instance every time it is injected',
        ],
        a: 'One instance, built once and reused',
        why: 'Singleton is the default, and almost always what you want. Nest builds the provider once and hands that same instance to everything that injects it. One catch: if two modules each list it in providers, each gets its own, which is why you provide it once and export it. Request scope builds a new one per request, and it spreads to everything that injects it. Transient gives each consumer its own copy.',
      },
    ],
  },
  {
    id: 'route',
    division: 'nest',
    kind: 'quiz',
    bullet: '3',
    color: '--green',
    short: 'Routing',
    name: 'Platform Signs',
    topic: 'Controllers, routes and params',
    pitch: 'A controller is a path prefix plus a set of routes. The traps are route order, where each input comes from, and which status code comes back.',
    rules: [
      'Given the decorators and a request, pick what actually happens.',
      'Route order matters more than you think.',
      'Watch which decorator pulls from where.',
    ],
    hook: '@Controller(prefix) + @Get(path) build the URL. On Express, routes match in the order you declare them, and the first match wins.',
    par: 95,
    sorts: [
      {
        t: 1,
        title: 'No @HttpCode anywhere, and your own code throws nothing. What status does each request get?',
        buckets: ['200 OK', '201 Created', '400 Bad Request', '404 Not Found'],
        items: [
          { name: 'GET /users, which returns an array', bucket: '200 OK', why: '200 is the default for every method except POST.' },
          { name: 'POST /users, which returns the new user', bucket: '201 Created', why: 'POST defaults to 201. Change it with @HttpCode() when a POST creates nothing, like a login.' },
          { name: 'DELETE /users/7, which returns nothing', bucket: '200 OK', why: 'DELETE is not special. It gets 200 like everything else unless you set @HttpCode(204) yourself.' },
          { name: 'POST /orders/7/cancel, which returns nothing', bucket: '201 Created', why: 'The default comes from the method, not from what you return. A POST that creates nothing still says 201 until you tell it otherwise.' },
          { name: 'GET /users/7, when the service returns null', bucket: '200 OK', why: 'Nest does not turn a missing record into a 404 for you. On Express you get 200 with an empty body. On Fastify the body is the text null. Either way, throw NotFoundException if a missing record should be a 404.' },
          { name: 'GET /users/abc, with ParseIntPipe on the id', bucket: '400 Bad Request', why: 'ParseIntPipe throws a BadRequestException before your handler runs. So this 400 does not come from your code. Stopping bad input early is the point of a pipe.' },
          { name: 'GET /userz, which no controller declares', bucket: '404 Not Found', why: 'No route matched, so Nest answers with its own 404. No handler, guard or pipe runs. Global middleware and a global exception filter still see the request.' },
        ],
        note: 'The default status comes from the HTTP method, not from what the handler returns. POST gets 201, and everything else gets 200. A status you did not write usually means a pipe rejected something (400) or no route matched (404). If you want a 404 for a missing record, you have to throw it.',
      },
      {
        t: 1,
        title: '`POST /orders/7/items/3?dryRun=true&page=2`, with the JSON body `{ "sku": "A1" }` and an x-api-key header. Which decorator gets you each piece?',
        buckets: ['@Param', '@Query', '@Body', '@Headers'],
        items: [
          { name: 'The 7 in /orders/7/items', bucket: '@Param', why: 'It is part of the path. The route declares it as :id in @Post(":id/items/:itemId"), so you read it with @Param("id"). It arrives as the string "7" unless a pipe converts it.' },
          { name: 'Both :id and :itemId at once, as one object', bucket: '@Param', why: 'Called with no name, @Param() hands you every route param in one object.' },
          { name: 'true, from ?dryRun=true', bucket: '@Query', why: 'Everything after the ? is the query string, so @Query("dryRun"). It arrives as the string "true", not a boolean, unless a pipe converts it.' },
          { name: 'dryRun and page together, as one object', bucket: '@Query', why: 'Called with no name, @Query() gives you the whole query string as an object.' },
          { name: 'The "A1" sent in the JSON', bucket: '@Body', why: 'The parsed JSON payload is @Body(). @Body("sku") picks one field out of it, though a DTO is the usual way.' },
          { name: 'The x-api-key value', bucket: '@Headers', why: '@Headers("x-api-key"). Header names are lowercase by the time Nest sees them.' },
        ],
        note: 'The URL has two parts you read: the path (@Param) and the query string (@Query). The request has two more: the body (@Body) and the headers (@Headers). Each one, called with no name, gives you the whole object instead of one value.',
      },
    ],
    questions: [
      {
        t: 1,
        q: 'Inside @Controller(\'users\'), which path does a bare @Get() handle?',
        opts: [
          '/users',
          '/users/:id',
          'Every path under /users',
        ],
        a: '/users',
        why: 'The method\'s path is added to the controller prefix, and an empty one adds nothing. So @Get() is GET /users and @Get(\':id\') is GET /users/42. Each method matches only its own path.',
      },
      {
        t: 1,
        q: 'Inside @Controller(\'users\'), which decorator handles PATCH /users/42?',
        opts: [
          '@Patch(\':id\')',
          '@Patch(\'users/:id\')',
          '@Put(\':id\')',
        ],
        a: '@Patch(\':id\')',
        why: 'Method paths are relative to the controller prefix, so @Patch(\'users/:id\') would answer PATCH /users/users/42. @Put is a different HTTP method. PUT usually replaces the whole thing, and PATCH changes part of it.',
      },
      {
        t: 1,
        q: 'How do you make a handler send 204 instead of the default status?',
        opts: [
          '@HttpCode(204) on the handler',
          '@Status(204) on the handler',
          '@Header(\'Status\', \'204\') on it',
        ],
        a: '@HttpCode(204) on the handler',
        why: '@HttpCode() sets the status of a successful response. There is no @Status() decorator, and @Header() sets a response header, not the status line. For a status that depends on runtime logic, inject @Res({ passthrough: true }) and call res.status(). For errors, throw an exception.',
      },
      {
        t: 1,
        q: 'Default Express adapter, no route options. A request comes in for GET /users/me. Which handler runs?',
        code: `@Controller('users')
export class UsersController {
  @Get(':id')  findOne(@Param('id') id: string) {}
  @Get('me')   me() {}
}`,
        opts: [
          "findOne runs, with id = 'me'",
          'me() runs, it is more specific',
          '404, the two routes conflict',
        ],
        a: "findOne runs, with id = 'me'",
        why: 'Nest registers routes in the order you declare them. On the default Express adapter, the first match wins. \':id\' matches any value, including \'me\', so findOne answers with id = \'me\'. To fix it, declare @Get(\'me\') above @Get(\':id\'). Nothing conflicts at startup, so there is no 404. Fastify ranks routes by specificity on its own, and Nest 12 can sort them or warn you, but both are opt-in.',
      },
      {
        t: 1,
        q: 'A POST handler returns successfully without setting a status. What does the client get?',
        code: `@Post()
create(@Body() dto: CreateUserDto) { return user; }`,
        opts: ['201 Created', '200 OK', '204 No Content'],
        a: '201 Created',
        why: 'POST defaults to 201 in Nest. Every other method defaults to 200. @HttpCode() overrides it.',
      },
      {
        t: 1,
        q: 'Which decorator gives you the parsed JSON body?',
        opts: ['@Body()', '@Param()', '@Query()'],
        a: '@Body()',
        why: '@Body() gives you the parsed body. @Param() reads values from the URL path, and @Query() reads the query string after the ?. Each decorator pulls one piece, so you never pass the whole req around.',
      },
      {
        t: 1,
        q: 'Request is GET /users/42. What is the runtime type of id here, with no pipes and no transform?',
        code: `@Get(':id')
findOne(@Param('id') id: number) { /* typeof id? */ }`,
        opts: [
          'string, because URLs are text',
          'number, TypeScript converts it',
          'a number only when transform is on',
        ],
        a: 'string, because URLs are text',
        why: 'The `: number` is only a TypeScript annotation, and TypeScript is gone at runtime. The URL is text, so id is the string "42". To get a real number, use @Param("id", ParseIntPipe), or ValidationPipe with transform: true.',
      },
      {
        t: 2,
        q: 'main.ts calls app.setGlobalPrefix("api"). What is the full path?',
        code: `@Controller('users')
export class UsersController { @Get() findAll() {} }`,
        opts: ['/api/users', '/users/api', '/users'],
        a: '/api/users',
        why: 'The global prefix sits in front of every controller path. Handy for keeping every API route under /api. For versions like /v1, Nest has app.enableVersioning() instead.',
      },
      {
        t: 2,
        q: 'What status does this return on success?',
        code: `@Delete(':id')
@HttpCode(204)
remove(@Param('id') id: string) { return this.users.remove(id); }`,
        opts: ['204 No Content', '200 OK anyway', '201 Created'],
        a: '204 No Content',
        why: '@HttpCode overrides the default. 204 is the usual choice for a delete that returns nothing.',
      },
      {
        t: 2,
        q: 'A handler returns a Promise<User[]>. What does Nest do?',
        opts: [
          'Awaits it and serializes the resolved value',
          'Sends the pending promise, which becomes {}',
          'Nothing, unless you call res.json yourself',
        ],
        a: 'Awaits it and serializes the resolved value',
        why: 'Nest waits for promises and observables, then sends the result. That is why handlers can be plain async functions.',
      },
      {
        t: 2,
        q: 'You inject @Res() res into a handler. What changes?',
        opts: [
          'You own the response. Returning a value does nothing',
          'Nothing changes. Nest still sends what you return',
          'Interceptor changes still reach the client',
        ],
        a: 'You own the response. Returning a value does nothing',
        why: 'That is library-specific mode. Nest stops sending the response, so you call res.json() or res.send() yourself, and whatever you return is ignored. Interceptors still run, but their changes to the returned value never reach the client. Guards, pipes and exception filters keep working as usual. If you only need res to set a cookie or a header, @Res({ passthrough: true }) keeps the standard handling on.',
      },
      {
        t: 2,
        q: 'Request is GET /users?page=2&limit=10. What is the value of page?',
        code: `@Get()
findAll(@Query('page') page: string) {}`,
        opts: ['"2" as a string', '2 as a number', '{ page: "2", limit: "10" }'],
        a: '"2" as a string',
        why: '@Query(\'page\') gives you that one value. Query values are always text, so it is the string "2". @Query() with no name gives you the whole object.',
      },
      {
        t: 3,
        q: 'What does @Param() with no name return here?',
        code: `@Get(':id/orders/:orderId')
one(@Param() params) {}`,
        opts: [
          'An object: { id, orderId }',
          'Only the first one, id',
          'The raw path as a string',
        ],
        a: 'An object: { id, orderId }',
        why: 'With no name, @Param() gives you every route param in one object. A name gives you one value. @Query() and @Body() work the same way.',
      },
      {
        t: 3,
        q: 'Default Express setup, no extra options. A catch-all route is declared first in the controller. What happens to the routes below it?',
        opts: [
          'They never match. Declaration order wins',
          'They still match: specific routes win',
          'Nest throws a route conflict at startup',
        ],
        a: 'They never match. Declaration order wins',
        why: 'By default, Nest registers routes in the order you declare them, and Express takes the first match. So list routes from most specific to least. The other two answers describe real features, just not defaults. Nest 12 can sort routes by specificity (routeResolutionStrategy) or flag the shadowing at startup (routeConflictPolicy). Fastify ranks by specificity anyway.',
      },
      {
        t: 3,
        q: 'How do you apply ParseIntPipe to one parameter only?',
        opts: [
          "@Param('id', ParseIntPipe) on that parameter",
          '@UsePipes(ParseIntPipe) on the controller',
          'app.useGlobalPipes(new ParseIntPipe())',
        ],
        a: "@Param('id', ParseIntPipe) on that parameter",
        why: 'Passing the pipe to @Param binds it to that one parameter. @UsePipes on the controller would run it on every parameter of every handler there, body included. A global pipe runs on every route in the app. Use the smallest scope that does the job.',
      },
      {
        t: 1,
        q: 'Which decorator reads the 42 out of GET /users/42?',
        opts: [
          '@Param(\'id\')',
          '@Query(\'id\')',
          '@Body(\'id\')',
        ],
        a: '@Param(\'id\')',
        why: 'Route params come from the path, so @Param. @Query reads ?key=value from the query string, and @Body reads the parsed request body.',
      },
      {
        t: 1,
        q: 'What turns a class into the handler for everything under /orders?',
        opts: [
          '@Controller(\'orders\')',
          '@Module(\'orders\')',
          '@Injectable(\'orders\')',
        ],
        a: '@Controller(\'orders\')',
        why: 'The string is the route prefix for every handler in the class. The controller still has to be listed in a module\'s controllers array, or Nest never registers its routes.',
      },
      {
        t: 3,
        q: 'Nest 12. You want /users/me to beat /users/:id on Express without reordering the methods. What do you set?',
        opts: [
          'routeResolutionStrategy: \'specificity\'',
          'routeConflictPolicy: { shadow: \'error\' }',
          '@Get(\'me\', { priority: 1 }) on the method',
        ],
        a: 'routeResolutionStrategy: \'specificity\'',
        why: 'Passed to NestFactory.create, \'specificity\' registers fixed segments like \'me\' before params like \':id\', and params before wildcards. routeConflictPolicy only reports the problem, as a warning or a startup error. Both are opt-in and default to the old behavior, and on Fastify the specificity sort has no effect, since its router already ranks routes that way. For the same reason, Fastify skips the shadow check.',
      },
    ],
  },
  {
    id: 'dto',
    division: 'nest',
    kind: 'quiz',
    bullet: '4',
    color: '--yellow',
    darkText: true,
    short: 'Validation',
    name: 'Ticket Check',
    topic: 'DTOs and the ValidationPipe',
    pitch: 'A DTO is a class that describes the shape of a request body. ValidationPipe reads the decorators on it and rejects anything that does not fit. That happens before your handler ever runs.',
    rules: [
      'Read the DTO, the pipe settings, and the incoming body.',
      'Decide what the API sends back.',
      'Pay attention to extra fields and to types.',
    ],
    hook: 'For ValidationPipe, a DTO must be a class (interfaces vanish at runtime). When validation fails, the client gets a 400 with a message array.',
    par: 95,
    flows: [
      {
        t: 2,
        title: 'POST /users with an extra isAdmin field. The global ValidationPipe has whitelist and forbidNonWhitelisted on',
        steps: [
          'JSON body parsed',
          'ValidationPipe runs',
          'Body becomes a CreateUserDto instance',
          'Decorators checked',
          'BadRequestException thrown',
          '400: "property isAdmin should not exist"',
        ],
        decoys: ['isAdmin quietly stripped', 'Route handler'],
        note: 'class-validator reads the decorators off a class instance. That is why the pipe turns the plain JSON object into a CreateUserDto first. With whitelist alone, isAdmin would be stripped quietly, and the handler would run. forbidNonWhitelisted turns that into a 400 instead. That is what you want from an API that should not accept fields it does not know.',
      },
    ],
    sorts: [
      {
        t: 1,
        title: 'whitelist: true is on. CreateUserDto has @IsEmail() email, @IsOptional() @MinLength(2) nickname, and password with no decorators. What happens to each field?',
        buckets: ['Passes', 'Stripped', 'Rejected with 400'],
        items: [
          { name: '"email": "ana@example.com"', bucket: 'Passes', why: 'Declared, decorated, and valid.' },
          { name: '"email": "ana"', bucket: 'Rejected with 400', why: '@IsEmail() fails, so the whole request comes back 400 with "email must be an email" in the message array.' },
          { name: 'nickname left out of the body', bucket: 'Passes', why: '@IsOptional() skips the other checks when the value is missing, so leaving it out is fine.' },
          { name: '"nickname": "A"', bucket: 'Rejected with 400', why: 'It is present, so @IsOptional() steps aside and @MinLength(2) runs. One character fails it.' },
          { name: '"isAdmin": true', bucket: 'Stripped', why: 'The DTO has no rules for it, so whitelist removes it before the handler sees the body.' },
          { name: '"password": "hunter22"', bucket: 'Stripped', why: 'This is the trap. whitelist keeps only properties with at least one decorator. So an undecorated field is removed, even though the class declares it. Give it @IsString() or similar.' },
        ],
        note: 'whitelist decides what survives by decorators, not by what the class declares. So every field you want to keep needs at least one. @IsOptional() only lets a missing value through. Once a value is present, the other checks run. One failing field fails the whole request.',
      },
      {
        t: 1,
        title: 'Three ValidationPipe options. Which one does each job?',
        buckets: ['whitelist', 'forbidNonWhitelisted', 'transform'],
        items: [
          { name: 'Quietly drop fields the DTO has no rules for', bucket: 'whitelist', why: 'whitelist: true removes anything without a decorator, and the request carries on.' },
          { name: 'Accept a body with extra fields, minus the extras', bucket: 'whitelist', why: 'Stripping is silent. The client never learns its extra fields were ignored.' },
          { name: 'Fail with 400 when an unknown field shows up', bucket: 'forbidNonWhitelisted', why: 'forbidNonWhitelisted turns stripping into an error. It only does anything with whitelist on too.' },
          { name: 'Tell the client exactly which extra field was the problem', bucket: 'forbidNonWhitelisted', why: 'The 400 says "property isAdmin should not exist", so the client can fix the request.' },
          { name: 'Turn the "42" in /users/42 into a number', bucket: 'transform', why: 'With transform on, a route param is converted to the type you annotated, so id: number really is a number. Without it, it is the string "42".' },
          { name: 'Hand the handler a real CreateUserDto instance', bucket: 'transform', why: 'Without transform, the handler gets a plain object. With it, the handler gets the class instance, so its methods work, and a field the client left out keeps the default written in the class.' },
        ],
        note: 'whitelist strips, forbidNonWhitelisted rejects, transform converts. A common setup turns on all three. Unknown fields fail loudly, and the handler gets a real DTO instance whose fields already passed their rules.',
      },
    ],
    questions: [
      {
        t: 1,
        q: 'Which decorator makes a string field need at least 8 characters?',
        opts: [
          '@MinLength(8)',
          '@Min(8)',
          '@MaxLength(8)',
        ],
        a: '@MinLength(8)',
        why: '@MinLength counts the characters in a string. @Min checks that a number is at least 8, so it fails on any string. @MaxLength sets the ceiling, not the floor.',
      },
      {
        t: 1,
        q: 'A DTO has @IsInt() age: number. The JSON body sends "age": "30". With a plain new ValidationPipe(), what happens?',
        opts: [
          '400, because "30" is a string',
          'It passes, and age is the number 30',
          'It passes, and age stays the string "30"',
        ],
        a: '400, because "30" is a string',
        why: '`age: number` is only a TypeScript type, and it converts nothing at runtime. JSON keeps "30" as a string, and @IsInt() rejects strings. Fix it on the client, or have the pipe convert it. That takes transform: true plus transformOptions: { enableImplicitConversion: true }. Without transform: true, whether the handler gets the converted value depends on your other options, so turn on both.',
      },
      {
        t: 1,
        q: 'The handler is create(@Body() dto: CreateUserDto). How does ValidationPipe know which rules to check?',
        opts: [
          'From the parameter type, CreateUserDto',
          'From options passed to @Body() at the route',
          'From a rules list given to ValidationPipe',
        ],
        a: 'From the parameter type, CreateUserDto',
        why: 'TypeScript saves the parameter\'s type, CreateUserDto, as metadata. The pipe gets that class (Nest calls it the metatype), builds the body into it, and checks its decorators. That is why the DTO has to be a class. An interface leaves only Object behind, and the pipe skips the parameter without checking anything. Neither @Body() nor ValidationPipe takes a rules list here.',
      },
      {
        t: 1,
        q: 'Global ValidationPipe is on. The body arrives as { "email": "nope", "password": "secret123" }. What comes back?',
        code: `export class CreateUserDto {
  @IsEmail() email: string;
  @MinLength(8) password: string;
}`,
        opts: [
          '400 with message: ["email must be an email"]',
          '422 with the same validation message array',
          '200, and your handler validates it itself',
        ],
        a: '400 with message: ["email must be an email"]',
        why: 'ValidationPipe throws a BadRequestException with a message array. Your handler never runs, so it can trust its input. It is a 400, not a 422, unless you change the pipe\'s errorHttpStatusCode option.',
      },
      {
        t: 1,
        q: 'With ValidationPipe and class-validator, why does a DTO have to be a class instead of an interface?',
        opts: [
          'Interfaces vanish at compile time, leaving nothing to read',
          'Classes validate faster than plain objects at runtime',
          'Nest only accepts classes as handler parameters',
        ],
        a: 'Interfaces vanish at compile time, leaving nothing to read',
        why: 'Interfaces are TypeScript only. They are deleted at compile time, so at runtime there is nothing for the pipe to read. A class survives, and its decorators with it. Speed has nothing to do with it, and handler parameters can be any type. The schema-first route in Nest 12, a Zod or Valibot schema with StandardSchemaValidationPipe, needs no class at all, because the schema itself exists at runtime.',
      },
      {
        t: 1,
        q: 'Your DTO has validation decorators, but no ValidationPipe is registered anywhere: not in useGlobalPipes, not as APP_PIPE, not in @UsePipes() or @Body(). What happens?',
        opts: [
          'Nothing is validated. The decorators just sit there',
          'Nest applies a default ValidationPipe anyway',
          'The app fails to start with a missing pipe error',
        ],
        a: 'Nothing is validated. The decorators just sit there',
        why: 'Decorators only attach metadata. Something has to read it and act on it, and that is ValidationPipe\'s job. Nest does not add one for you, and nothing complains at startup.',
      },
      {
        t: 2,
        q: 'ValidationPipe is configured with whitelist: true. The body includes an extra isAdmin: true. What happens?',
        opts: [
          'isAdmin is stripped before the handler sees it',
          'isAdmin triggers a 400 before the handler runs',
          'isAdmin is passed through to your service as is',
        ],
        a: 'isAdmin is stripped before the handler sees it',
        why: 'whitelist keeps only properties that have validation decorators, and drops the rest without an error. It is the cheapest protection against mass assignment: a client setting a field it should not, like isAdmin.',
      },
      {
        t: 2,
        q: 'Now whitelist and forbidNonWhitelisted are both true, and the body still has isAdmin: true.',
        opts: [
          '400 with "property isAdmin should not exist"',
          'The field is stripped and the request continues',
          '500, because the DTO shape no longer matches',
        ],
        a: '400 with "property isAdmin should not exist"',
        why: 'Same check, but now an unknown field is an error instead of being dropped. The 400 names the field. Use it when you would rather fail than quietly ignore a field the client thinks it is sending.',
      },
      {
        t: 2,
        q: 'ValidationPipe has transform: true. The request is GET /users/42. What is id?',
        code: `@Get(':id')
findOne(@Param('id') id: number) {}`,
        opts: ['The number 42', 'The string "42"', '400 Bad Request'],
        a: 'The number 42',
        why: 'With transform on, a single route param or query value is converted to its declared type, here Number. Without it, you get the string "42". This only covers lone values like this one. Fields inside a DTO are not converted unless you add @Type(() => Number) or enableImplicitConversion.',
      },
      {
        t: 2,
        q: 'What does @IsOptional() actually do?',
        opts: [
          'Skips its validators if null or undefined',
          'Strips that field from the validated payload',
          'Marks the matching database column nullable',
        ],
        a: 'Skips its validators if null or undefined',
        why: 'Without it, a missing field fails its validators. With it, a null or undefined value skips them, so the rules only apply when there is a value to check. It does not strip anything, and it has nothing to do with the database.',
      },
      {
        t: 2,
        q: 'You need an update DTO where every field from CreateUserDto is optional. What is the clean way?',
        opts: [
          'class UpdateUserDto extends PartialType(CreateUserDto)',
          'class UpdateUserDto implements Partial<CreateUserDto>',
          'type UpdateUserDto = Partial<CreateUserDto>',
        ],
        a: 'class UpdateUserDto extends PartialType(CreateUserDto)',
        why: 'PartialType builds a new class with every field optional, and it copies the validation rules. The other two only change the TypeScript type, which is gone at runtime, so the pipe has no rules to check. PartialType, PickType and OmitType come from @nestjs/mapped-types. With Swagger, import them from @nestjs/swagger instead.',
      },
      {
        t: 2,
        q: 'Which package do @IsEmail and @MinLength come from?',
        opts: ['class-validator', 'class-transformer', '@nestjs/common'],
        a: 'class-validator',
        why: 'class-validator has the rules. class-transformer turns the plain JSON object into a class instance. ValidationPipe needs both installed.',
      },
      {
        t: 3,
        q: 'CreateOrderDto has an address: AddressDto field. What makes the nested object actually get validated?',
        opts: [
          '@ValidateNested() plus @Type(() => AddressDto)',
          '@IsObject() plus @Type(() => AddressDto)',
          'Nothing. Nested DTOs validate automatically',
        ],
        a: '@ValidateNested() plus @Type(() => AddressDto)',
        why: '@ValidateNested() says to check the inner object against its own rules. @Type(() => AddressDto) says which class to build it as, because JSON arrives as a plain object with no rules attached. Leave out @Type and the inner rules never run. With default options, a bad address gets through. With whitelist on, its fields get stripped, or rejected if forbidNonWhitelisted is on. @IsObject() only checks that the value is an object, not what is inside it.',
      },
      {
        t: 3,
        q: 'Where does validation sit in the request lifecycle?',
        opts: [
          'After guards and interceptors, before the handler',
          'Before guards, as the first thing that runs',
          'Inside the service, when the DTO is used',
        ],
        a: 'After guards and interceptors, before the handler',
        why: 'Pipes run after guards and the before-half of interceptors, right before the handler. A request that fails auth should not cost you a validation pass, which is part of why guards run first.',
      },
      {
        t: 3,
        q: 'What is the difference between a DTO and an entity?',
        opts: [
          'A DTO shapes a request, an entity shapes a table',
          'An entity shapes a request, a DTO shapes a table',
          'They are the same thing under two names',
        ],
        a: 'A DTO shapes a request, an entity shapes a table',
        why: 'A DTO describes what the API accepts. An entity describes a database table. Keeping them separate stops internal columns, like passwordHash, leaking into the API. It also lets each one change without breaking the other.',
      },
      {
        t: 1,
        q: 'Which decorator makes a DTO field reject anything that is not an email?',
        opts: [
          '@IsEmail()',
          '@Email()',
          '@IsString({ email: true })',
        ],
        a: '@IsEmail()',
        why: 'class-validator decorators read like sentences: @IsEmail(), @MinLength(8), @IsOptional(). ValidationPipe runs them, and on their own they do nothing. There is no @Email(), and @IsString() has no email option.',
      },
      {
        t: 1,
        q: 'How do you turn validation on for every route in the app?',
        opts: [
          'app.useGlobalPipes(new ValidationPipe())',
          'app.use(new ValidationPipe()) in main.ts',
          'app.enableValidation({ whitelist: true })',
        ],
        a: 'app.useGlobalPipes(new ValidationPipe())',
        why: 'app.useGlobalPipes in main.ts applies it to every route. app.use registers Express middleware, which runs before Nest knows the handler, so it never sees your DTO types. Providing it with the APP_PIPE token in a module does the same job and lets the pipe inject dependencies.',
      },
      {
        t: 1,
        q: 'A DTO field is declared password: string with no decorators. Does ValidationPipe check it?',
        opts: [
          'No. Only decorated fields get checked',
          'Yes. The TypeScript type is enforced',
          'Yes. Every field is required by default',
        ],
        a: 'No. Only decorated fields get checked',
        why: 'TypeScript types are erased before the code runs. class-validator only knows what the decorators tell it, so an undecorated field is not checked at all, and with whitelist on it gets stripped.',
      },
      {
        t: 3,
        q: 'Nest 12. On its own, what does @Body({ schema: createUserSchema }) do?',
        opts: [
          'Attaches the schema, until a pipe checks it',
          'Validates the body against that schema now',
          'Builds a DTO class out of the schema for you',
        ],
        a: 'Attaches the schema, until a pipe checks it',
        why: 'The decorator only attaches schema metadata. Validation happens once you register StandardSchemaValidationPipe, for example with app.useGlobalPipes(new StandardSchemaValidationPipe()). Same lesson as class-validator: decorators describe, a pipe enforces. It works with any Standard Schema library, like Zod, Valibot or ArkType.',
      },
    ],
  },
  {
    id: 'block',
    division: 'nest',
    kind: 'quiz',
    bullet: '5',
    color: '--purple',
    short: 'Which tool',
    name: 'Dispatch Desk',
    topic: 'Guards, pipes, interceptors, filters, middleware',
    pitch: 'Nest gives you five places to put logic that many routes share. Knowing which one a job belongs in is one of the most senior-sounding things you can show in this interview.',
    rules: [
      'Read the job, pick the building block.',
      'One best answer each time, and the reason matters.',
      'This is the one to replay before the call.',
    ],
    hook: 'Middleware: raw req/res. Guard: can you? Pipe: is this input valid and the right type? Interceptor: wrap before and after. Filter: turn errors into responses.',
    par: 85,
    drill: 'Ask what the job needs. The raw request, before Nest knows which handler it is for? A yes or no on whether this request may continue? One argument, checked or converted? Code on both sides of your handler? Something that already went wrong?',
    sorts: [
      {
        t: 1,
        title: 'One route, GET /invoices/:id/pdf. Which building block does each part of the job?',
        buckets: ['Middleware', 'Guard', 'Pipe', 'Interceptor', 'Exception filter'],
        items: [
          { name: 'Parse the session cookie onto req.cookies', bucket: 'Middleware', why: 'cookie-parser is Express middleware. It works on the raw request, before Nest knows which handler it is for.' },
          { name: 'Only signed-in users may download at all', bucket: 'Guard', why: 'A yes or no on whether the request continues is a guard.' },
          { name: 'Reject an :id that is not a UUID', bucket: 'Pipe', why: 'Checking one argument is a pipe. ParseUUIDPipe does exactly this.' },
          { name: 'Log how long the PDF took to build', bucket: 'Interceptor', why: 'Timing the build needs code right before the handler and right after it. An interceptor wraps the handler, so it has both.' },
          { name: 'Give up if the PDF takes over 10 seconds', bucket: 'Interceptor', why: 'An interceptor can add timeout(10000) to what next.handle() returns, then turn the timeout error into a RequestTimeoutException. That needs code around the handler.' },
          { name: 'Answer a missing invoice with your 404 shape', bucket: 'Exception filter', why: 'The service throws NotFoundException. A filter turns a thrown error into a response, so it is where your 404 shape lives.' },
        ],
        note: 'One feature usually touches several blocks. Ask the same question of each part. Does it need the raw request, a yes or no, one argument, both sides of the handler, or something that already went wrong?',
      },
      {
        t: 1,
        title: 'Which building block does each job?',
        buckets: ['Middleware', 'Guard', 'Pipe', 'Interceptor', 'Exception filter'],
        items: [
          { name: 'Check that the user is an admin', bucket: 'Guard', why: 'A yes or no on whether this request may continue. In practice it is a RolesGuard reading the roles you attached to the route with a decorator.' },
          { name: 'Turn the "42" in /posts/42 into the number 42', bucket: 'Pipe', why: 'Converting one argument before the handler sees it. Nest ships ParseIntPipe for exactly this.' },
          { name: 'Reject a body that is missing its email', bucket: 'Pipe', why: 'ValidationPipe checks the body against its DTO, and the body is one argument. The 400 goes back before your handler runs.' },
          { name: 'Strip passwordHash out of every response', bucket: 'Interceptor', why: 'Reshaping what comes back means working on the handler\'s return value before it becomes JSON, which is the after half of an interceptor. Nest ships ClassSerializerInterceptor, paired with @Exclude() on the entity. It needs a class instance by default. For plain objects, use @SerializeOptions({ type }), or Nest 12\'s StandardSchemaSerializerInterceptor with a schema. A response schema has to drop keys it does not list, or passwordHash goes through.' },
          { name: 'Time how long the handler took', bucket: 'Interceptor', why: 'You need a timestamp before the handler and another after it. An interceptor wraps both sides in one class.' },
          { name: 'Send the same JSON error shape for every failure', bucket: 'Exception filter', why: 'Turning a thrown error into a response is the whole job. One global filter gives the whole API one error shape.' },
          { name: 'Add security headers before anything else runs', bucket: 'Middleware', why: 'helmet is plain Express middleware, applied with app.use(helmet()). It works on the raw response before Nest has picked a handler. Register it before other app.use() calls, since routes set up earlier miss it.' },
        ],
        note: 'Five boxes, five questions. Does it need the raw request before routing? Middleware. Is it a yes or no? Guard. Is it about one argument? Pipe. Does it need both sides of the handler? Interceptor. Did something already go wrong? Filter.',
      },
      {
        t: 3,
        title: 'Same five boxes, real packages. Where does each one live?',
        buckets: ['Middleware', 'Guard', 'Pipe', 'Interceptor', 'Exception filter'],
        items: [
          { name: 'Rate limit every route, except ones marked @SkipThrottle()', bucket: 'Guard', why: 'ThrottlerGuard, bound globally with APP_GUARD. It has to read metadata off the handler to honor @SkipThrottle(), and middleware runs before there is a handler to read.' },
          { name: 'Check the JWT, except on routes marked @Public()', bucket: 'Guard', why: 'Skipping @Public() routes means reading metadata off the handler. A guard can do that through Reflector, and middleware runs before there is a handler to read. In practice it is AuthGuard("jwt") from @nestjs/passport, extended to check @Public() first, and the user lands on req.user for everything after.' },
          { name: 'Fall back to page 1 when ?page is missing', bucket: 'Pipe', why: 'DefaultValuePipe, chained before ParseIntPipe: @Query("page", new DefaultValuePipe(1), ParseIntPipe).' },
          { name: 'Answer a repeat GET from memory for 30 seconds', bucket: 'Interceptor', why: 'CacheInterceptor from @nestjs/cache-manager. On a hit it answers without calling your handler at all. On a miss it stores what the handler returned. Wrapped around the handler, it gets both halves in one place.' },
          { name: 'Turn Prisma error P2025 into a 404', bucket: 'Exception filter', why: 'Prisma throws its own error when a record is not found. A filter that catches it and answers 404 keeps that translation out of every service.' },
          { name: 'Parse cookies onto req for everything downstream', bucket: 'Middleware', why: 'cookie-parser is Express middleware, applied with app.use(cookieParser()). Everything after it, guards included, can read req.cookies.' },
        ],
        note: 'The ecosystem uses the same five boxes. If a package needs to know which handler it is protecting, it is a guard. If it needs the raw request before routing, it is middleware. Read the job to find the box. The box tells you which package to look for.',
      },
    ],
    questions: [
      {
        t: 1,
        q: 'Turn ?active=true into a real boolean before the handler sees it.',
        opts: [
          'Pipe: validate or convert an input',
          'Interceptor: wrap the handler',
          'Middleware: raw request, pre-routing',
        ],
        a: 'Pipe: validate or convert an input',
        why: 'Converting one input is a pipe. Nest ships ParseBoolPipe: @Query(\'active\', ParseBoolPipe) gives you true, and anything other than "true" or "false" gets a 400.',
      },
      {
        t: 1,
        q: 'Rename _id to id in every response from one controller.',
        opts: [
          'Interceptor: wrap the handler',
          'Pipe: validate or convert an input',
          'Guard: is this request allowed?',
        ],
        a: 'Interceptor: wrap the handler',
        why: 'An interceptor gets the handler\'s return value as data, so a map() over next.handle() can rename the field. Bind it with @UseInterceptors() on that one controller. Pipes only touch inputs, and a guard only allows or blocks.',
      },
      {
        t: 1,
        q: 'Send your own JSON shape whenever a NotFoundException is thrown.',
        opts: [
          'Filter: turn an error into a response',
          'Interceptor: wrap the handler',
          'Middleware: raw request, pre-routing',
        ],
        a: 'Filter: turn an error into a response',
        why: 'Put @Catch(NotFoundException) on a filter class and bind it. A filter only runs once something was thrown, and it decides what the client gets back. An interceptor could catch it with catchError, but it would miss errors thrown before it runs, like a guard\'s.',
      },
      {
        t: 1,
        q: 'Reject any request whose JWT does not carry the admin role.',
        opts: [
          'Guard: is this request allowed?',
          'Interceptor: wrap the handler',
          'Param decorator: a handler shortcut',
        ],
        a: 'Guard: is this request allowed?',
        why: 'A guard answers one yes-or-no question before interceptors, pipes and the handler run. Returning false gives a 403. Middleware runs even earlier, but it cannot read the route\'s metadata, like which roles a route needs.',
      },
      {
        t: 1,
        q: 'Convert the :id in the URL to a number, and reject with 400 if it is not one.',
        opts: [
          'Pipe: validate or convert an input',
          'Guard: is this request allowed?',
          'Filter: turn an error into a response',
        ],
        a: 'Pipe: validate or convert an input',
        why: 'Converting and checking one input is a pipe\'s job. Nest has one built in: @Param(\'id\', ParseIntPipe). A guard could reject the request, but it would not convert the value for the handler.',
      },
      {
        t: 1,
        q: 'Wrap every successful response in { data: ... } without touching 40 handlers.',
        opts: [
          'Interceptor: wrap the handler',
          'Middleware: raw request, pre-routing',
          'Param decorator: a handler shortcut',
        ],
        a: 'Interceptor: wrap the handler',
        why: 'An interceptor gets the handler\'s return value as data, before Nest turns it into JSON, so wrapping it is one map(). Middleware runs before routing and only has the raw response, so it would have to patch res.json() to do the same. A param decorator only feeds inputs to a handler.',
      },
      {
        t: 1,
        q: 'Turn every thrown error into your standard error JSON shape, and log it.',
        opts: [
          'Filter: turn an error into a response',
          'Interceptor: wrap the handler',
          'Guard: is this request allowed?',
        ],
        a: 'Filter: turn an error into a response',
        why: 'Filters catch what was thrown and decide the response. A global one gives the whole API one error shape, and it is the natural place to log. An interceptor misses errors thrown before it runs, like a guard\'s.',
      },
      {
        t: 2,
        q: 'Attach an x-request-id header to every incoming request before anything else runs.',
        opts: [
          'Middleware: raw request, pre-routing',
          'Interceptor: wrap the handler',
          'Param decorator: a handler shortcut',
        ],
        a: 'Middleware: raw request, pre-routing',
        why: 'Middleware is first in line and works on the raw request, before Nest has picked a handler. So the id is there for everything after it, guards included.',
      },
      {
        t: 2,
        q: 'Log how long each handler takes, tagged with the controller and method name.',
        opts: [
          'Interceptor: wrap the handler',
          'Middleware: raw request, pre-routing',
          'Filter: turn an error into a response',
        ],
        a: 'Interceptor: wrap the handler',
        why: 'You need both sides of the handler to time it, and the ExecutionContext to name it. Start a timer before next.handle(), then read it in finalize(), or tap({ next, error }), so failed calls get logged too. Middleware could time the whole request with res.on(\'finish\'), but it never learns which controller and method handled it.',
      },
      {
        t: 2,
        q: 'Give every handler a @CurrentUser() shortcut instead of reaching into req.user.',
        opts: [
          'Param decorator: a handler shortcut',
          'Guard: is this request allowed?',
          'Pipe: validate or convert an input',
        ],
        a: 'Param decorator: a handler shortcut',
        why: 'createParamDecorator builds @CurrentUser(), which reads req.user and hands it to the handler. The guard is what put user on the request in the first place. A pipe only works on an input you already asked for.',
      },
      {
        t: 2,
        q: 'Make sure passwordHash never appears in any serialized user.',
        opts: [
          'Interceptor: wrap the handler',
          'Pipe: validate or convert an input',
          'Middleware: raw request, pre-routing',
        ],
        a: 'Interceptor: wrap the handler',
        why: 'Serialization means turning the return value into JSON, which happens on the way out. That is interceptor territory. ClassSerializerInterceptor with @Exclude() does it, but it needs the handler to return a class instance. In Nest 12, StandardSchemaSerializerInterceptor does it with a response schema that drops keys it does not list. Pipes and whitelist only protect incoming data.',
      },
      {
        t: 2,
        q: 'A global auth guard is on, but /health has to stay public.',
        opts: [
          'Guard: is this request allowed?',
          'Interceptor: wrap the handler',
          'Middleware: raw request, pre-routing',
        ],
        a: 'Guard: is this request allowed?',
        why: 'Put a @Public() decorator on /health. The guard reads that metadata with Reflector and lets the request through. The rule stays in the guard, and the exception sits right on the route. An interceptor runs after the guard, so it is too late to undo a rejection. This pattern, @Roles() and @Public(), shows up in most real Nest codebases.',
      },
      {
        t: 3,
        q: 'Cache GET responses for 30 seconds.',
        opts: [
          'Interceptor: wrap the handler',
          'Middleware: raw request, pre-routing',
          'Guard: is this request allowed?',
        ],
        a: 'Interceptor: wrap the handler',
        why: 'A cache has to answer before the handler on a hit, and store what comes back after it on a miss. An interceptor does both in one place, gets the result as data, and knows which route it is on. Middleware could do it, but only by capturing the raw response body. A guard only allows or blocks a request. It cannot answer with a cached response.',
      },
      {
        t: 3,
        q: 'Rate limit by IP, before any handler work happens.',
        opts: [
          'Guard: is this request allowed?',
          'Pipe: validate or convert an input',
          'Interceptor: wrap the handler',
        ],
        a: 'Guard: is this request allowed?',
        why: '@nestjs/throttler ships ThrottlerGuard for this. It is a yes-or-no gate on the request, and as a guard it can honor @SkipThrottle() on a route. Express middleware like express-rate-limit works too, but it is not one of the choices here.',
      },
      {
        t: 3,
        q: 'Run an existing Express library like helmet or cookie-parser.',
        opts: [
          'Middleware: raw request, pre-routing',
          'Interceptor: wrap the handler',
          'Guard: is this request allowed?',
        ],
        a: 'Middleware: raw request, pre-routing',
        why: 'Middleware is the Express-compatible layer, so existing Express libraries plug straight in with app.use().',
      },
      {
        t: 1,
        q: 'Only let a request through if its x-api-key header matches.',
        opts: [
          'Guard: is this request allowed?',
          'Pipe: validate or convert an input',
          'Filter: turn an error into a response',
        ],
        a: 'Guard: is this request allowed?',
        why: 'Allowed or not is a guard. It reads the header off the ExecutionContext and returns true or false, and false becomes a 403. To send a 401 instead, throw UnauthorizedException from the guard.',
      },
      {
        t: 1,
        q: 'Trim the whitespace off every string in the request body.',
        opts: [
          'Pipe: validate or convert an input',
          'Guard: is this request allowed?',
          'Filter: turn an error into a response',
        ],
        a: 'Pipe: validate or convert an input',
        why: 'Changing an input before the handler sees it is a pipe. A small custom PipeTransform does it, bound globally and listed before ValidationPipe, so validation sees the trimmed values.',
      },
    ],
  },
  {
    id: 'err',
    division: 'nest',
    kind: 'quiz',
    bullet: '6',
    color: '--orange',
    short: 'Errors',
    name: 'Fault Line',
    topic: 'Exceptions and status codes',
    pitch: 'Nest turns thrown exceptions into HTTP responses for you. Knowing which exception gives which status code, and what happens when you throw something random, helps in interviews and in production.',
    rules: [
      'Pick the status code or the behavior.',
      'Built-in exceptions are just classes with a status attached.',
      'Anything Nest does not recognize becomes a 500.',
    ],
    hook: 'throw new NotFoundException() → 404. Guard returns false → 403. Plain Error → 500 with the message hidden.',
    par: 85,
    drill: 'Ask what the client needs to learn. That they sent something wrong? That we do not know who they are? That we know who they are, and the answer is no? That the thing is not there? That it clashes with something that already exists?',
    sorts: [
      {
        t: 1,
        title: 'Which exception does each situation call for?',
        buckets: ['BadRequestException', 'UnauthorizedException', 'ForbiddenException', 'NotFoundException', 'ConflictException'],
        items: [
          { name: 'A ?limit of -5', bucket: 'BadRequestException', why: '400. The client sent something that cannot be right, and they can fix it.' },
          { name: 'A request with no token at all', bucket: 'UnauthorizedException', why: '401. We have no idea who this is, so we cannot even ask whether they are allowed.' },
          { name: 'A token that expired an hour ago', bucket: 'UnauthorizedException', why: 'Still 401. An expired token proves nothing about who you are now, so it is the same as no token.' },
          { name: 'A signed-in viewer tries to delete a project', bucket: 'ForbiddenException', why: '403. We know exactly who this is, and their role does not allow it.' },
          { name: 'GET /orders/99, and order 99 is not there', bucket: 'NotFoundException', why: '404. The thing they asked for does not exist.' },
          { name: 'Signup with an email someone already registered', bucket: 'ConflictException', why: '409. Nothing is wrong with the input on its own. It clashes with a record that already exists.' },
        ],
        note: 'Read each one as a sentence to the client. 400: you sent something wrong. 401: I do not know who you are. 403: I know who you are, and no. 404: that is not here. 409: that clashes with what already exists.',
      },
    ],
    flows: [
      {
        t: 1,
        title: 'GET /orders/99. OrdersService throws new NotFoundException(\'Order 99 not found\'), and there is no custom filter',
        start: 1,
        steps: [
          'Service throws NotFoundException',
          'It passes up through the handler',
          'Nest looks for a filter that catches it',
          'The built-in filter takes it',
          'Status and message read off the exception',
          '404 sent with statusCode, message, error',
        ],
        decoys: ['Converted to a 500 first', 'Handler sends an empty 200'],
        note: 'You do not catch HTTP exceptions in the handler. They travel up on their own. Nest reads the status and message off the exception and builds the response. With no filter of your own, Nest\'s built-in global filter does it. A plain Error from a library would become a 500 instead.',
      },
    ],
    questions: [
      {
        t: 1,
        q: 'What does a 500 tell the client?',
        opts: [
          'Something broke on the server',
          'Their request body was invalid',
          'They are not allowed to do that',
        ],
        a: 'Something broke on the server',
        why: '5xx means the server failed. 4xx means the client sent something wrong or is not allowed. In Nest, an error that is not an HttpException usually ends up as a 500. Errors that already carry an HTTP status, like the 413 for a request body that is too large, keep it. That is why "not found" should be thrown as NotFoundException.',
      },
      {
        t: 1,
        q: 'Which class do Nest\'s built-in exceptions like NotFoundException extend?',
        opts: [
          'HttpException',
          'ExceptionFilter',
          'RpcException',
        ],
        a: 'HttpException',
        why: 'Every built-in HTTP exception extends HttpException, which carries a status and a response body, and the built-in filter knows how to send any of them. ExceptionFilter is the interface filters implement, and RpcException is for microservices.',
      },
      {
        t: 1,
        q: 'The service throws NotFoundException. What does the controller have to do?',
        opts: [
          'Nothing. Nest turns it into the 404',
          'Catch it and send the 404 through res',
          'Catch it and rethrow it as an Error',
        ],
        a: 'Nothing. Nest turns it into the 404',
        why: 'HTTP exceptions travel up on their own, and Nest builds the response from the status and message they carry. Catching them in the controller is just extra code. Rethrowing one as a plain Error turns it into a 500.',
      },
      {
        t: 1,
        q: 'A service runs: throw new NotFoundException("User 7 not found"). What does the client get?',
        opts: [
          '404 with a statusCode, message and error body',
          '500, since the throw came from the service',
          '400, because the id matched no record',
        ],
        a: '404 with a statusCode, message and error body',
        why: 'NotFoundException already carries its 404. Nest catches it on the way out and builds the response. Where it was thrown does not matter, so a throw from a service is not a 500. It is not a 400 either, because the id was valid input. The record just is not there.',
      },
      {
        t: 1,
        q: 'An auth guard returns false. What does the client get?',
        opts: ['403 Forbidden', '401 Unauthorized', '500 Internal Server Error'],
        a: '403 Forbidden',
        why: 'Returning false throws ForbiddenException. If you want a 401 or a custom message, throw UnauthorizedException from the guard instead.',
      },
      {
        t: 1,
        q: 'A library inside your service throws a plain Error("connection lost"). What does the client see?',
        opts: [
          '500 with a generic message, text hidden',
          "500 with 'connection lost' in the body",
          '400 with the error message attached',
        ],
        a: '500 with a generic message, text hidden',
        why: 'A plain Error becomes a 500 with the generic message "Internal server error", so its text does not leak. Nest\'s built-in filter still logs the original error with its stack, so you can find it in your logs.',
      },
      {
        t: 2,
        q: 'ValidationPipe rejects the body. Which status code?',
        opts: ['400 Bad Request', '422 Unprocessable Entity', '409 Conflict'],
        a: '400 Bad Request',
        why: 'BadRequestException with a message array is the default. If your API prefers 422, set errorHttpStatusCode on the ValidationPipe, or take full control with exceptionFactory.',
      },
      {
        t: 2,
        q: 'throw new HttpException("I am a teapot", 418). What comes back?',
        opts: ['418 with that message', '500, because 418 is not a built-in', '400'],
        a: '418 with that message',
        why: 'HttpException is the base class: a body and a status. The named ones are just subclasses with the status filled in, and there is even an ImATeapotException.',
      },
      {
        t: 2,
        q: 'When do you use 401 versus 403?',
        opts: [
          '401 means not authenticated, 403 means not allowed',
          '401 means not allowed, 403 means not authenticated',
          'They mean the same thing, so pick either one',
        ],
        a: '401 means not authenticated, 403 means not allowed',
        why: 'A missing or expired token gets a 401, because we do not know who you are. A valid token without the right role gets a 403, because we know who you are and the answer is no.',
      },
      {
        t: 2,
        q: 'Signup hits a unique constraint because the email already exists. Which exception fits?',
        opts: [
          'ConflictException (409)',
          'BadRequestException (400)',
          'NotFoundException (404)',
        ],
        a: 'ConflictException (409)',
        why: '409 says the request itself is fine, but it clashes with data that already exists. Catch the database\'s unique-constraint error and rethrow it as a ConflictException. It is not a 400, because nothing is wrong with the email on its own.',
      },
      {
        t: 2,
        q: 'What is the default Nest error body shape?',
        opts: [
          '{ statusCode, message, error }',
          '{ ok: false, error, at, path }',
          '{ status, title, detail }',
        ],
        a: '{ statusCode, message, error }',
        why: 'A built-in exception given a message, like new NotFoundException(\'Order 99 not found\'), sends statusCode, message and an error name. With no message, it sends just statusCode and message, and so does a bare HttpException. message can be a string or an array (validation). Nest 12 adds an optional errorCode field. Teams usually standardize the shape with a global filter.',
      },
      {
        t: 2,
        q: '@Catch() with no arguments catches what?',
        opts: [
          'Everything thrown, including non-HTTP errors',
          'Only HttpException and the classes extending it',
          'Nothing until you pass it an exception type',
        ],
        a: 'Everything thrown, including non-HTTP errors',
        why: 'With no arguments, @Catch() catches anything thrown, plain Errors included. @Catch(HttpException) narrows it to HttpException and its subclasses. A bare @Catch() is how you build one filter that handles every error.',
      },
      {
        t: 3,
        q: 'A route has @UseFilters(RouteFilter) and the app has a global filter. Both match the thrown error. Which one handles it?',
        opts: [
          'The route-level filter, the closest match',
          'Both, route first and then the global one',
          'The global one, registered earliest wins',
        ],
        a: 'The route-level filter, the closest match',
        why: 'Nest checks route filters first, then controller filters, then global ones, and the first match handles the error. Only that one filter runs.',
      },
      {
        t: 3,
        q: 'A common Nest convention: the service throws NotFoundException when a user is missing. What is the trade-off?',
        opts: [
          'The service now depends on HTTP status codes',
          'Nest can no longer turn it into a 404 response',
          'The controller has to catch it and rethrow it',
        ],
        a: 'The service now depends on HTTP status codes',
        why: 'NotFoundException is an HTTP class, so the service now knows about HTTP. For most REST apps that is fine, and it keeps controllers thin, since Nest turns the throw into a 404 with no catch needed. If the same service also runs outside HTTP, like in a queue worker, throw your own error, like UserNotFoundError. Then one exception filter maps it to a 404 for HTTP.',
      },
      {
        t: 3,
        q: 'You want a guard to return 401 with "token expired" instead of a bare 403.',
        opts: [
          "throw new UnauthorizedException('token expired')",
          'return false and set res.status(401) yourself',
          'throw it from a pipe bound to that route',
        ],
        a: "throw new UnauthorizedException('token expired')",
        why: 'Guards can throw as well as return false, and throwing is how you control the status and the message. The string you pass becomes message in the response body.',
      },
      {
        t: 1,
        q: 'Which exception do you throw when a user id matches nothing?',
        opts: [
          'NotFoundException',
          'BadRequestException',
          'ForbiddenException',
        ],
        a: 'NotFoundException',
        why: '404 means the thing does not exist. BadRequest is for input the client got wrong, and Forbidden is for a client who is not allowed. Picking the right one is what makes an API predictable.',
      },
      {
        t: 1,
        q: 'A login comes in with the wrong password. Which exception fits?',
        opts: [
          'UnauthorizedException',
          'ForbiddenException',
          'BadRequestException',
        ],
        a: 'UnauthorizedException',
        why: '401 means we do not know who you are, which is exactly a failed login. 403 is for someone we do know who is not allowed. That distinction comes up in interviews all the time.',
      },
      {
        t: 1,
        q: 'How do you send a 404 with your own message?',
        opts: [
          'throw new NotFoundException(\'No such order\')',
          'return { status: 404, message: \'No such order\' }',
          'res.status(404).send(\'No such order\')',
        ],
        a: 'throw new NotFoundException(\'No such order\')',
        why: 'Throw it and let Nest build the response. Returning an object sends it as the body with a success status (200, or 201 on a POST), and reaching for res means you have taken over the response yourself.',
      },
      {
        t: 3,
        q: 'Nest 12. Clients want a stable code to branch on instead of parsing the message. Where does it go?',
        opts: [
          'errorCode: \'WEAK_PASSWORD\' in the options',
          'Prefixed onto the start of the message text',
          'cause: \'WEAK_PASSWORD\' in the options',
        ],
        a: 'errorCode: \'WEAK_PASSWORD\' in the options',
        why: 'new BadRequestException("Password is too weak", { errorCode: "WEAK_PASSWORD" }). Nest adds errorCode to the response body, unless you pass your own object as the body. cause is different: it is for your logs and is not sent to the client.',
      },
    ],
  },
  {
    id: 'api',
    division: 'nest',
    kind: 'quiz',
    bullet: '7',
    color: '--teal',
    short: 'The API',
    name: 'Tool Shed',
    topic: 'What you implement: the interface, the method, how you bind it',
    pitch: 'Knowing that a guard decides yes or no is half an answer. The other half is what you type: the interface you implement, the method Nest calls, what Nest hands that method, and how you attach it to a route. This line is that other half.',
    rules: [
      'Pick what you would actually write.',
      'Signatures and return types matter here.',
      'Binding is part of the answer.',
    ],
    hook: 'canActivate returns a boolean. transform returns the new value. intercept returns next.handle(), piped. catch writes the response. use calls next().',
    drill: 'Ask what Nest hands the method and what it expects back. Is it deciding? Changing one value? Wrapping the handler? Holding an error? Holding the raw req, res and next?',
    par: 95,
    flows: [
      {
        t: 1,
        title: 'A LoggingInterceptor times GET /cats',
        steps: [
          'Request reaches intercept()',
          'Note the start time',
          'Call next.handle()',
          'Route handler runs',
          'tap() sees the result',
          'Log the elapsed time',
          'Response sent',
        ],
        decoys: ['Call next() to continue', 'Return true to let it through'],
        note: 'Code before next.handle() runs on the way in. next.handle() returns an Observable, and the handler runs when Nest subscribes to it. So everything after the handler goes in pipe(): tap() to look at the result, map() to change it. That is "wraps the handler" in one picture.',
      },
    ],
    questions: [
      {
        t: 1,
        q: 'Which interface does a guard class implement?',
        opts: [
          'CanActivate',
          'NestGuard',
          'Guardable',
        ],
        a: 'CanActivate',
        why: 'Guards implement CanActivate from @nestjs/common, which gives them one method, canActivate(context). Pipes implement PipeTransform, interceptors NestInterceptor, filters ExceptionFilter, and class middleware NestMiddleware.',
      },
      {
        t: 1,
        q: 'What does a pipe\'s transform() return?',
        opts: [
          'The value the handler receives',
          'true to continue, false to block',
          'An Observable of the response',
        ],
        a: 'The value the handler receives',
        why: 'Whatever transform() returns is what the handler parameter gets. That is how ParseIntPipe turns "42" into 42. To reject a value, a pipe throws, usually a BadRequestException. Returning true or false is what a guard does.',
      },
      {
        t: 1,
        q: 'How do you bind an exception filter to one route?',
        opts: [
          '@UseFilters(HttpErrorFilter)',
          '@Catch(HttpErrorFilter)',
          '@UseGuards(HttpErrorFilter)',
        ],
        a: '@UseFilters(HttpErrorFilter)',
        why: '@UseFilters() binds a filter to a handler or a controller, the way @UseGuards() does for guards. @Catch() goes on the filter class itself and says which exceptions it handles. @UseGuards would treat the filter as a guard, which it is not.',
      },
      {
        t: 1,
        q: 'What does canActivate() return?',
        opts: [
          'A boolean, or a Promise or Observable of one',
          'The request object, modified or as it came in',
          'Nothing, since rejecting is done by throwing',
        ],
        a: 'A boolean, or a Promise or Observable of one',
        why: 'canActivate(context: ExecutionContext) returns boolean | Promise<boolean> | Observable<boolean>. True lets the request through. False makes Nest throw ForbiddenException, a 403. Throw UnauthorizedException yourself when you want a 401.',
      },
      {
        t: 1,
        q: 'Your interceptor returns of(cached) and never calls next.handle(). What happens?',
        opts: [
          'The route handler never runs',
          'Nest calls the handler for you',
          'The request fails with a 500',
        ],
        a: 'The route handler never runs',
        why: 'of(cached) is an RxJS Observable that emits one value. The handler only runs through next.handle(), so skipping that call means the handler never runs. The client gets what your Observable emits, here the cached value. That is exactly how a cache interceptor answers from memory. Forgetting the call by accident is a classic bug.',
      },
      {
        t: 1,
        q: 'A class middleware never calls next() and never sends a response. What happens?',
        opts: [
          'The request hangs until it times out',
          'Nest moves on and runs the guards anyway',
          'Nest answers with a 404 by default',
        ],
        a: 'The request hangs until it times out',
        why: 'Middleware has to either end the response or call next(). Do neither, and nothing ever answers the client, so the request hangs until something times out. Nest does not step in, because it only takes over when next() is called.',
      },
      {
        t: 1,
        q: 'Which method does a pipe implement?',
        opts: [
          'transform(value, metadata)',
          'validate(value, metadata)',
          'parse(value, argumentMetadata)',
        ],
        a: 'transform(value, metadata)',
        why: 'PipeTransform has one method, transform(value, metadata). value is the argument on its way in, and metadata says where it came from (body, query, param) and its type. Whatever you return is what the handler receives. Throwing rejects it.',
      },
      {
        t: 1,
        q: 'How do you put RolesGuard on every route in one controller?',
        opts: [
          '@UseGuards(RolesGuard) on the class',
          '@Guard(RolesGuard) on the class',
          'List it in the module providers',
        ],
        a: '@UseGuards(RolesGuard) on the class',
        why: '@UseGuards on the class covers every route in that controller. On a method, it covers just that route. Listing it in providers only lets Nest build it, and does not attach it to anything. There is no @Guard() decorator. The others follow the same pattern: @UsePipes, @UseInterceptors, @UseFilters.',
      },
      {
        t: 1,
        q: 'Where do you register class middleware for the cats routes?',
        opts: [
          'configure(): consumer.apply(LoggerMiddleware).forRoutes(\'cats\')',
          'In @Module({ middleware: [LoggerMiddleware] })',
          'With @UseMiddleware(LoggerMiddleware) on the controller',
        ],
        a: 'configure(): consumer.apply(LoggerMiddleware).forRoutes(\'cats\')',
        why: 'Middleware is the odd one out. There is no decorator for it and no @Module key. Instead, the module implements NestModule and wires it up in configure(consumer: MiddlewareConsumer). Plain app.use() in main.ts works too, but that middleware cannot use DI.',
      },
      {
        t: 2,
        q: 'What does intercept() return?',
        opts: [
          'An Observable, usually next.handle() piped',
          'The plain value the handler returned',
          'A boolean saying whether the handler may run',
        ],
        a: 'An Observable, usually next.handle() piped',
        why: 'intercept(context, next) returns an Observable, or a Promise of one if you need to await something first. next.handle() gives you the handler result as a stream, and RxJS operators shape it: tap to look, map to change, catchError to recover. That is why interceptors feel different from the rest.',
      },
      {
        t: 2,
        q: 'Inside an exception filter, how do you get the Express response object?',
        opts: [
          'host.switchToHttp().getResponse()',
          'exception.getResponse()',
          'this.response, injected by Nest',
        ],
        a: 'host.switchToHttp().getResponse()',
        why: 'catch(exception, host) gets an ArgumentsHost. It works for HTTP, WebSockets and microservices, so you first switch to HTTP, then ask for the response. exception.getResponse() is the trap. On an HttpException it returns the error body, not the Express response. Nest does not inject a this.response either.',
      },
      {
        t: 2,
        q: 'Why register a global guard with APP_GUARD instead of app.useGlobalGuards()?',
        opts: [
          'APP_GUARD lets the guard inject dependencies',
          'useGlobalGuards only applies inside one module',
          'APP_GUARD runs before any middleware',
        ],
        a: 'APP_GUARD lets the guard inject dependencies',
        why: 'useGlobalGuards(new X()) in main.ts takes an instance you built yourself, outside any module, so Nest injects nothing. You can hand it dependencies with app.get(), but that gets clumsy fast. As an APP_GUARD provider it is built by DI and can inject Reflector or a service. APP_PIPE, APP_INTERCEPTOR and APP_FILTER work the same way.',
      },
      {
        t: 3,
        q: 'Roles are set on both the controller and the method, and the method should win. Which call does the guard make?',
        opts: [
          'getAllAndOverride(Roles, [handler, class])',
          'getAllAndMerge(Roles, [handler, class])',
          'get(Roles, context.getClass())',
        ],
        a: 'getAllAndOverride(Roles, [handler, class])',
        why: 'getAllAndOverride checks the targets in the order you pass them, and returns the first value it finds. The handler comes first, so the method beats the class. getAllAndMerge combines both into one list. get reads a single target, and here it would read the class only.',
      },
      {
        t: 3,
        q: 'What does ExecutionContext add on top of ArgumentsHost?',
        opts: [
          'getHandler() and getClass()',
          'switchToHttp() and getArgs()',
          'getRequest() and getResponse()',
        ],
        a: 'getHandler() and getClass()',
        why: 'ArgumentsHost wraps the handler arguments and gives you switchToHttp(). ExecutionContext extends it with getHandler() and getClass(), which is what lets a guard or interceptor read metadata off the route.',
      },
      {
        t: 3,
        q: 'Your global filter should keep the default error handling and add logging. What does it do?',
        opts: [
          'Extend BaseExceptionFilter and call super.catch()',
          'Implement ExceptionFilter and rethrow the error',
          'Catch it, log it, then call next(exception)',
        ],
        a: 'Extend BaseExceptionFilter and call super.catch()',
        why: 'BaseExceptionFilter is the built-in behavior. Extend it, log, then hand off with super.catch(exception, host), so the client still gets the standard response. It needs the HTTP adapter to send that response. Register it with APP_FILTER and Nest supplies it, or pass it in yourself: new MyFilter(httpAdapter). Built with a bare new MyFilter(), super.catch() crashes and the client gets a 500. Rethrowing is not a real hand-off. From a global filter, the error escapes Nest, and Express sends its own HTML error page.',
      },
    ],
    sorts: [
      {
        t: 1,
        title: 'You are writing one of each. Which building block is each piece of code for?',
        buckets: ['Middleware', 'Guard', 'Pipe', 'Interceptor', 'Exception filter'],
        items: [
          { name: 'canActivate(context)', bucket: 'Guard', why: 'The one method on CanActivate. It gets an ExecutionContext and returns a boolean.' },
          { name: 'Returning false sends back a 403', bucket: 'Guard', why: 'A guard returning false makes Nest throw ForbiddenException. Throw UnauthorizedException yourself for a 401.' },
          { name: 'transform(value, metadata)', bucket: 'Pipe', why: 'The one method on PipeTransform. Whatever it returns is what the handler receives.' },
          { name: 'intercept(context, next)', bucket: 'Interceptor', why: 'The one method on NestInterceptor. next is a CallHandler, and next.handle() gives you the route handler\'s result as an Observable.' },
          { name: 'Returns next.handle().pipe(map(...))', bucket: 'Interceptor', why: 'That pipe is RxJS, not a Nest pipe. Shaping the handler result on the way out is interceptor work.' },
          { name: 'catch(err, host)', bucket: 'Exception filter', why: 'The one method on ExceptionFilter. host is an ArgumentsHost, and switchToHttp() gets you the response to write.' },
          { name: 'use(req, res, next)', bucket: 'Middleware', why: 'The one method on NestMiddleware. It gets the raw request and response (Express objects on the default adapter), and it has to call next() or end the response.' },
        ],
        note: 'Five interfaces, five methods. CanActivate.canActivate decides. PipeTransform.transform changes one value. NestInterceptor.intercept wraps the handler and returns a stream. ExceptionFilter.catch turns an error into a response. NestMiddleware.use gets the raw req, res and next.',
      },
    ],
  },
  {
    id: 'auth',
    division: 'nest',
    kind: 'quiz',
    bullet: '8',
    color: '--magenta',
    short: 'Auth',
    name: 'Turnstile',
    topic: 'Authentication and authorization',
    pitch: 'Auth comes up in nearly every backend interview, and Nest has a clear shape for it. One piece checks who you are and puts the user on the request. Guards decide what you may do. Open routes opt out with metadata. Learn that shape, and the library underneath stops mattering.',
    rules: [
      'Tell who you are apart from what you may do.',
      'Follow the token from login to the next request.',
      'Know which piece does which job.',
    ],
    hook: 'Authentication is who you are (401). Authorization is what you may do (403). A guard checks the token and puts the user on the request. @Public() opts a route out. Roles are metadata a guard reads.',
    drill: 'Ask which question is being answered: who is this, or may they do this? Then ask where in the request that has to happen, and what the route itself has to say about it.',
    par: 100,
    sorts: [
      {
        t: 1,
        title: 'A JWT guard runs on every route, and DELETE /projects/:id also needs the admin role. What does each request get?',
        buckets: ['401 Unauthorized', '403 Forbidden', 'Allowed through'],
        items: [
          { name: 'GET /projects with no Authorization header', bucket: '401 Unauthorized', why: 'No token, so nobody to identify.' },
          { name: 'A token signed with some other secret', bucket: '401 Unauthorized', why: 'The signature does not verify, so the token proves nothing about who sent it.' },
          { name: 'A real token that expired yesterday', bucket: '401 Unauthorized', why: 'Expired means unauthenticated. Logging in again fixes it, which is the test for 401.' },
          { name: 'A valid viewer token on DELETE /projects/3', bucket: '403 Forbidden', why: 'We know who this is, and the answer is no. Logging in again would not change that.' },
          { name: 'A valid admin token on DELETE /projects/3', bucket: 'Allowed through', why: 'Authenticated, and the role check passes.' },
          { name: 'No token, on GET /health marked @Public()', bucket: 'Allowed through', why: 'The guard reads the @Public() metadata and skips the check.' },
        ],
        note: '401 means we do not know who you are, because the token is missing, forged or expired. 403 means we know who you are, and the answer is no. The quick test: would logging in again fix it? Then it is a 401.',
      },
    ],
    questions: [
      {
        t: 1,
        q: 'Who can read the payload of a JWT?',
        opts: [
          'Anyone holding the token',
          'Only the server with the secret',
          'Only the user it was issued to',
        ],
        a: 'Anyone holding the token',
        why: 'A standard JWT is signed, not encrypted. The payload is only base64url-encoded, a reversible text format, so anyone with the token can decode it. The signature only proves nobody changed it, so never put a password or anything secret in there.',
      },
      {
        t: 1,
        q: 'A request hits a protected route with no token at all. Which status fits?',
        opts: [
          '401 Unauthorized',
          '403 Forbidden',
          '400 Bad Request',
        ],
        a: '401 Unauthorized',
        why: '401 means "we do not know who you are", and logging in fixes it. 403 is for a known user who is not allowed. A JWT guard throws UnauthorizedException when there is no token to check.',
      },
      {
        t: 1,
        q: 'What does the sub claim in a JWT usually hold?',
        opts: [
          'The user id',
          'The user\'s roles',
          'When it expires',
        ],
        a: 'The user id',
        why: 'sub is the subject: who the token is about, and how the guard knows whose request it is. Expiry lives in exp. Roles are a custom claim you add yourself, if you add them at all.',
      },
      {
        t: 1,
        q: 'What is the difference between authentication and authorization?',
        opts: [
          'Who you are, versus what you may do',
          'Signing in, versus signing back out',
          'Passwords, versus tokens and sessions',
        ],
        a: 'Who you are, versus what you may do',
        why: 'Authentication answers who is this, and failing it is a 401. Authorization answers may they do this, and failing it is a 403. Interviewers love asking for the difference, and the status codes are the tidy way to show you know it.',
      },
      {
        t: 1,
        q: 'Where does a JWT usually travel on a request?',
        opts: [
          'Authorization: Bearer <token> header',
          'A ?token= parameter on every URL',
          'A token field in the JSON body',
        ],
        a: 'Authorization: Bearer <token> header',
        why: 'The standard is the Authorization header with the Bearer scheme. Query strings end up in server logs and browser history, which is the last place a token should be.',
      },
      {
        t: 1,
        q: 'Where do you check the token on a protected route?',
        opts: [
          'In a guard, before the handler runs',
          'In the service, at the top of each method',
          'In an exception filter after the handler',
        ],
        a: 'In a guard, before the handler runs',
        why: 'A guard runs before the pipes and the handler, so a bad token never costs you validation or a database call. The rule also lives in one place, instead of in every service method. An exception filter only runs after something throws, so it cannot check anything up front.',
      },
      {
        t: 1,
        q: 'After the auth guard passes, where does the user usually end up?',
        opts: [
          'On the request, as req.user',
          'In a module-level variable',
          'In the response headers sent back',
        ],
        a: 'On the request, as req.user',
        why: 'The guard, or a Passport strategy behind it, attaches the user to the request. Everything after the guard can read it from there. A @CurrentUser() param decorator is the tidy way to hand it to a handler.',
      },
      {
        t: 1,
        q: 'How should a password be stored?',
        opts: [
          'As a slow, salted hash like bcrypt',
          'Encrypted with a key on the server',
          'As plain text in a locked-down table',
        ],
        a: 'As a slow, salted hash like bcrypt',
        why: 'Hash it with something deliberately slow and salted, like bcrypt, scrypt or argon2, and compare hashes at login. Encryption can be reversed by whoever has the key, which is exactly what you do not want.',
      },
      {
        t: 1,
        q: 'A global auth guard is on. How does /health stay reachable?',
        opts: [
          'Mark it @Public() and have the guard skip it',
          'Register /health before the guard loads',
          'Give /health its own module with no providers',
        ],
        a: 'Mark it @Public() and have the guard skip it',
        why: '@Public() puts metadata on the route. The guard reads it with Reflector before checking anything, and returns true early. The default stays safe, with everything locked, and each exception is visible right on the route. Registration order and an empty module do not change which guards run.',
      },
      {
        t: 2,
        q: 'What makes @Public() work?',
        code: 'export const IS_PUBLIC_KEY = \'isPublic\';\nexport const Public = () => SetMetadata(IS_PUBLIC_KEY, true);',
        opts: [
          'The guard reads that metadata with Reflector',
          'SetMetadata removes the guard from the route',
          'Nest skips all guards on decorated routes',
        ],
        a: 'The guard reads that metadata with Reflector',
        why: 'SetMetadata only attaches data. Nothing happens until the guard asks for it, usually reflector.getAllAndOverride(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]), and returns true early.',
      },
      {
        t: 2,
        q: 'The token is valid, but the user lacks the admin role. Which status?',
        opts: [
          '403 Forbidden',
          '401 Unauthorized',
          '404 Not Found',
        ],
        a: '403 Forbidden',
        why: 'We know exactly who they are, so it is not a 401. They are not allowed, which is a 403. Some APIs answer 404 to hide that the resource exists, but 403 is the textbook answer.',
      },
      {
        t: 2,
        q: 'With Passport, what happens to the value your strategy\'s validate() returns?',
        opts: [
          'It becomes req.user',
          'It is signed into a new JWT',
          'It is sent back as the response',
        ],
        a: 'It becomes req.user',
        why: 'Whatever validate() returns, Passport puts on req.user. For a JWT strategy, Passport has already checked the signature and expiry before validate() runs. So validate() just turns the payload into whatever you want on req.user.',
      },
      {
        t: 3,
        q: 'A JWT strategy\'s validate() is called. What has Passport already done?',
        opts: [
          'Verified the signature and decoded it',
          'Looked the user up in your database',
          'Checked the user\'s roles for this route',
        ],
        a: 'Verified the signature and decoded it',
        why: 'Passport verifies the signature with your secret and, with ignoreExpiration false, rejects expired tokens before validate() ever runs. Looking the user up or checking roles is your code, if you need it.',
      },
      {
        t: 3,
        q: 'Why is a JWT hard to revoke before it expires?',
        opts: [
          'The server checks it without storing it',
          'It is encrypted, so it cannot be read',
          'The browser caches it until expiry',
        ],
        a: 'The server checks it without storing it',
        why: 'A JWT is signed, not stored. Any server with the key can verify it without asking a database. That is the appeal, and also the catch: there is no record to delete. The usual answers are a short expiry plus refresh tokens (longer-lived tokens used only to get new short ones), or a denylist of revoked tokens.',
      },
      {
        t: 3,
        q: 'Where should the JWT signing secret come from?',
        opts: [
          'Config or env, read through ConfigService',
          'A constant committed in auth.module.ts',
          'The payload of the token being checked',
        ],
        a: 'Config or env, read through ConfigService',
        why: 'A secret in the repo is a secret everyone with repo access has. Read it from the environment, typically with ConfigService and JwtModule.registerAsync, so each environment has its own and it can be rotated.',
      },
    ],
    flows: [
      {
        t: 1,
        title: 'A user logs in, then calls GET /orders with the token they got back',
        steps: [
          'POST /auth/login with email and password',
          'Find the user by email',
          'Compare the password with the stored hash',
          'Sign a JWT with the user id as sub',
          'Client sends Authorization: Bearer <token>',
          'Guard verifies the signature and expiry',
          'User attached to req.user',
          'Handler returns their orders',
        ],
        decoys: ['Decrypt the stored password', 'Look the token up in the database'],
        note: 'Login is the only time the password is used. It is compared as a hash, never decrypted. After that, the token does the work. The guard verifies it with just the secret, with no database lookup. That is why JWTs scale, and also why they are hard to revoke.',
      },
    ],
  },
  {
    id: 'test',
    division: 'nest',
    kind: 'quiz',
    bullet: '9',
    color: '--slate',
    short: 'Testing',
    name: 'Test Track',
    topic: 'Testing modules, mocks and e2e',
    pitch: 'Every Nest interview gets to testing, and the follow-up is always "how would you test that?" The answer is mostly one tool: a testing module that builds just enough of your app, with the parts you do not want swapped for fakes.',
    rules: [
      'Know what the testing module gives you.',
      'Decide what to fake and what to keep real.',
      'Tell a unit test from an end-to-end one.',
    ],
    hook: 'Test.createTestingModule({...}).compile() builds a small app. overrideProvider swaps a dependency. get() pulls out what you are testing. createNestApplication() plus supertest is end to end.',
    drill: 'Ask what is under test and what is in the way. Build only what the test needs, fake whatever talks to the outside world, and keep the thing you are testing real.',
    par: 100,
    sorts: [
      {
        t: 1,
        title: 'Unit test or e2e test? Pick the one that actually proves each claim.',
        buckets: ['Unit test', 'E2E test'],
        items: [
          { name: 'Orders over $100 get 10% off', bucket: 'Unit test', why: 'Business logic in a service. Build OrdersService with fakes and call the method.' },
          { name: 'A price formatter rounds to two decimals', bucket: 'Unit test', why: 'No Nest involved at all. Call the function.' },
          { name: 'RolesGuard says no to a viewer', bucket: 'Unit test', why: 'Build the guard with a Reflector, hand canActivate() a fake ExecutionContext, and check it returns false. One decision needs no HTTP.' },
          { name: 'POST /orders with a bad body comes back 400', bucket: 'E2E test', why: 'This is wiring: the route, the DTO and ValidationPipe together. Gotcha: pipes set up in main.ts do not exist in the test app unless you add them there too, or register them with APP_PIPE.' },
          { name: 'GET /orders without a token comes back 401', bucket: 'E2E test', why: 'Proves the guard is actually bound to the route, which a unit test of the guard cannot.' },
          { name: 'Every module wires up and the app boots', bucket: 'E2E test', why: 'Building the app from AppModule and calling init() catches a missing import before production does.' },
        ],
        note: 'Unit tests prove a decision is right. E2E tests prove the pieces are connected: the route, the guard, the pipe, the module imports. A guard with perfect unit tests still fails you if nobody bound it to the route.',
      },
    ],
    questions: [
      {
        t: 1,
        q: 'You called Test.createTestingModule({ ... }). What do you call before you can get anything out of it?',
        opts: [
          'await .compile()',
          'await .init()',
          'await .listen()',
        ],
        a: 'await .compile()',
        why: 'createTestingModule() returns a builder. compile() resolves every dependency and gives you a TestingModule, which is what you call get() on. init() and listen() belong to an app you create from it afterward, for e2e tests. One catch: compile() does not run onModuleInit hooks. Those run when you call init(), on the compiled module or on an app made from it.',
      },
      {
        t: 1,
        q: 'Unit testing OrdersService, which injects PaymentsService. What goes in providers?',
        opts: [
          'OrdersService, and a fake for PaymentsService',
          'Just OrdersService, on its own',
          'OrdersService and the real PaymentsService',
        ],
        a: 'OrdersService, and a fake for PaymentsService',
        why: 'The testing module has to resolve every constructor argument, or compile() throws the same resolve error the app would. Provide the class you are testing for real, and { provide: PaymentsService, useValue: fake } for what it talks to.',
      },
      {
        t: 1,
        q: 'An e2e test ends with .expect(200). What does that check?',
        opts: [
          'The status code of the response',
          'That it returned 200 items',
          'That it answered within 200 ms',
        ],
        a: 'The status code of the response',
        why: 'In supertest, .expect() with a number asserts the status code. Pass an object or a function to check the body, or chain .then() and use your test runner\'s expect.',
      },
      {
        t: 1,
        q: 'What does Test.createTestingModule() take?',
        opts: [
          'The same metadata you would give @Module()',
          'A path to the module file it should load first',
          'A list of the spec files to run, in that order',
        ],
        a: 'The same metadata you would give @Module()',
        why: 'It takes a module metadata object, controllers, providers and imports, exactly like @Module(), and returns a builder. Calling compile() on that gives you a TestingModule.',
      },
      {
        t: 1,
        q: 'OrdersService calls PaymentsService, which calls Stripe. You are unit testing OrdersService. What do you fake?',
        opts: [
          'PaymentsService',
          'OrdersService',
          'Both of them, to be safe',
        ],
        a: 'PaymentsService',
        why: 'Keep the thing under test real and fake what it talks to. Faking OrdersService would test nothing, and faking PaymentsService keeps Stripe out of it without caring how payments work inside.',
      },
      {
        t: 1,
        q: 'After compile(), how do you get the instance you want to test?',
        opts: [
          'moduleRef.get(OrdersService)',
          'new OrdersService(), like any class',
          'moduleRef.inject(OrdersService)',
        ],
        a: 'moduleRef.get(OrdersService)',
        why: 'get() returns the instance DI built, with its dependencies, real or overridden, already injected. new OrdersService() skips DI, so you would be wiring dependencies by hand, which is exactly what the testing module saves you from.',
      },
      {
        t: 1,
        q: 'What does overrideProvider(X).useValue(fake) do?',
        opts: [
          'Injects fake wherever X was asked for',
          'Adds fake as a second copy of X',
          'Copies fake\'s methods onto the real X',
        ],
        a: 'Injects fake wherever X was asked for',
        why: 'Everything in the testing module that injects X gets your fake instead. The real X is never built, and nothing is copied onto it. useClass and useFactory work the same way when a plain object is not enough.',
      },
      {
        t: 1,
        q: 'What is the difference between a unit test and an e2e test in Nest?',
        opts: [
          'One class with fakes, versus real HTTP through the app',
          'Quick tests, versus slow, thorough ones',
          'Tests you write, versus tests the CLI generates',
        ],
        a: 'One class with fakes, versus real HTTP through the app',
        why: 'A unit test builds one class with its dependencies faked and calls its methods directly. An e2e test boots the app, sends real HTTP requests with supertest, and checks the responses.',
      },
      {
        t: 1,
        q: 'In the standard Nest e2e setup, how does a test send a request to your app?',
        opts: [
          'request(app.getHttpServer()).get("/cats")',
          'app.get("/cats") on the Nest app instance',
          'fetch("http://localhost:3000/cats")',
        ],
        a: 'request(app.getHttpServer()).get("/cats")',
        why: 'supertest takes the app\'s HTTP server and, if it is not listening yet, starts it on a random free port for the request. So you never call listen() or pick a port, and fetch to localhost:3000 would find nothing there. app.get() does exist, but it pulls a provider out of the container. It is not an HTTP GET.',
      },
      {
        t: 2,
        q: 'A route uses @UseGuards(JwtAuthGuard). In an e2e test of what the route returns, what is the clean way past the guard?',
        opts: [
          'overrideGuard with a fake that returns true',
          'Comment out @UseGuards while the test runs',
          'Mark the route @Public() for the test suite',
        ],
        a: 'overrideGuard with a fake that returns true',
        why: 'overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true }). The guard gets its own test, and this one stays about the route. If the route reads req.user, the fake has to set it too. A global guard registered with APP_GUARD and useClass is out of overrideGuard\'s reach. To make it swappable, register it as { provide: APP_GUARD, useExisting: JwtAuthGuard } and list JwtAuthGuard in providers too. Then swap it with overrideProvider(JwtAuthGuard). Editing the code under test to make a test pass means you are no longer testing that code.',
      },
      {
        t: 2,
        q: 'Nest 12\'s ESM scaffold defaults to Vitest. Your team\'s repo uses Jest. What changes about Test.createTestingModule?',
        opts: [
          'Nothing. Nest\'s testing API is the same',
          'You import Test from a different package',
          'Only the e2e helpers work under Jest',
        ],
        a: 'Nothing. Nest\'s testing API is the same',
        why: '@nestjs/testing is runner-agnostic, so nothing in the Nest API changes. What changes is the mock syntax, vi.fn() versus jest.fn(), and the config. CommonJS scaffolds still default to Jest. One v12 catch: Nest\'s packages now ship as ESM, and Jest can only load them on Node.js 24.9 or later.',
      },
      {
        t: 2,
        q: 'What does useMocker() on the testing module builder do?',
        opts: [
          'Creates a mock for any dependency you did not provide',
          'Replaces every provider in the module with an auto mock',
          'Records calls so you can assert on them later',
        ],
        a: 'Creates a mock for any dependency you did not provide',
        why: 'Instead of listing a fake for every dependency, you pass useMocker a factory. Nest calls it with each token nobody provided, and injects whatever it returns. Handy for classes with many collaborators you do not care about in this test.',
      },
      {
        t: 3,
        q: 'A provider is request-scoped. How do you get it from the testing module?',
        opts: [
          'await moduleRef.resolve(X)',
          'moduleRef.get(X)',
          'await moduleRef.getScoped(X)',
        ],
        a: 'await moduleRef.resolve(X)',
        why: 'get() is for singletons. Request-scoped and transient providers are built per context, so you ask for one with resolve(), which is async. Each resolve() call makes a new context, so you get a new instance every time, unless you pass the same contextId.',
      },
      {
        t: 3,
        q: 'Why call app.close() in afterAll in an e2e test?',
        opts: [
          'Open handles keep the test runner from exiting',
          'It resets the database between test files',
          'It writes a snapshot of every response',
        ],
        a: 'Open handles keep the test runner from exiting',
        why: 'Your providers can hold database connections, timers or queue clients, and those keep Node running, so the runner hangs or warns about open handles. app.close() runs the shutdown hooks, like onModuleDestroy, where those get cleaned up.',
      },
      {
        t: 3,
        q: 'You want to unit test RolesGuard. What do you hand canActivate()?',
        opts: [
          'A fake ExecutionContext with the request you want',
          'A real HTTP request sent with supertest',
          'Nothing. Guards can only be tested end to end',
        ],
        a: 'A fake ExecutionContext with the request you want',
        why: 'A guard is a class with one method. Build an object shaped like an ExecutionContext, with switchToHttp().getRequest() returning your request and getHandler() and getClass() for metadata, and assert on the boolean.',
      },
    ],
    flows: [
      {
        t: 1,
        title: 'Writing an e2e test for GET /orders, with the payment provider faked',
        steps: [
          'Test.createTestingModule({ imports: [AppModule] })',
          'overrideProvider(PaymentsService)',
          'compile()',
          'createNestApplication()',
          'app.init()',
          'request(app.getHttpServer()).get("/orders")',
          'Assert on the status and body',
          'app.close()',
        ],
        decoys: ['app.listen(3000)', 'moduleRef.get(OrdersController)'],
        note: 'Build the module, swap what touches the outside world, compile, then turn it into an app and init it. Overrides belong on the builder, so they come before compile(). supertest starts the server on a random free port when it needs one, so you never call app.listen(). Close the app at the end, or open connections can keep the runner from exiting.',
      },
    ],
  },
];

/** Field guide for the NestJS division, including interview talking points. */
export const NEST_GUIDE: Record<NestLineId, Guide> = {
  life: {
    plain: 'A request does not go straight to your handler. It passes through a line of checkpoints, always in the same order, and each one can stop it. Only the checkpoints you attached are there.\n\nMiddleware sees the raw request first, before Nest has picked a handler. Guards decide whether the request may continue. Interceptors wrap the handler, so they run code before it and again after it. Pipes check and convert the handler\'s inputs. Then your handler runs, usually calling a service.\n\nOn the way back out, the interceptors finish. That is where you can reshape the response. If anything threw along the way, an exception filter turns the error into the HTTP response instead.',
    words: [
      [
        'middleware',
        'Runs first, before Nest has picked a handler. It gets the plain req, res and next, same as Express middleware.',
      ],
      [
        'guard',
        'Answers one question: may this request continue? Returning true lets it through. Returning false stops it with a 403.',
      ],
      [
        'interceptor',
        'Wraps the handler, so one class can run code before the handler and again after it returns.',
      ],
      [
        'pipe',
        'Checks or converts one input, like the body or an :id, right before the handler gets it.',
      ],
      [
        'route handler',
        'The controller method that answers the route, like create() under @Post(). This is your code.',
      ],
      [
        'exception filter',
        'Catches a thrown error and decides what HTTP response goes back. Nest has a built-in one, so you only write your own to change its behavior.',
      ],
      [
        'global vs controller vs route',
        'Where you attached it: the whole app, one controller, or one route. Global runs first on the way in, and last on the way out.',
      ],
    ],
    code: {
      label: 'the whole line in one picture',
      snippet: `// 1 middleware    app.use() / configure(consumer)
// 2 guards        @UseGuards(AuthGuard)
// 3 interceptors  @UseInterceptors(LoggingInterceptor)   <-- before
// 4 pipes         @Body() dto  +  ValidationPipe
// 5 handler       @Post() create(@Body() dto) { ... }
// 6 service       this.usersService.create(dto)
// 7 interceptors  map(data => ({ data }))                <-- after
// 8 response
// if anything throws: an exception filter, @Catch(), builds the response`,
    },
    say: [
      'Middleware, guards, interceptors, pipes, then the handler and its service. Then the interceptors again on the way out, and the response. If anything throws, an exception filter builds the response instead.',
      'Within each kind, it goes global, then controller, then route. On the way out, interceptors reverse, so the route interceptor finishes first.',
      'If a guard says no, the pipes and the handler never run. That is why auth belongs in a guard and not in the service.',
      'Interceptors are the only layer that gets the handler\'s return value, and they also know which handler ran. That is why response shaping and caching live there.',
    ],
    gotcha: 'Middleware runs before Nest picks a handler. So anything that needs the handler, like reading @Roles() off it, cannot live in middleware. Use a guard or an interceptor. Also, if middleware throws, only a global exception filter can catch it. Controller and route filters belong to a handler, and none has been picked yet.',
    rehearse: [
      {
        prompt: 'Walk me through what happens when a request hits a NestJS app.',
        answer: 'Middleware runs first, then guards, then interceptors, then pipes, then the route handler and whatever services it calls. On the way back out, the interceptors finish. If anything threw, an exception filter turns the error into the response.',
      },
      {
        prompt: 'Why does auth belong in a guard instead of the service?',
        answer: 'A guard runs before the pipes and the handler. So a rejected request never costs a validation pass or any business logic. The rule also lives in one place, instead of being repeated in every service method.',
      },
      {
        prompt: 'What can an interceptor do that middleware cannot?',
        answer: 'An interceptor knows which handler is running, through the ExecutionContext. It also gets the value the handler returned, before Nest sends it. So it can reshape the response, cache it per handler, or read metadata like roles. Middleware runs before Nest picks a handler. It can time a whole request by waiting for the response to finish, but it never sees the handler or its return value.',
      },
    ],
  },
  di: {
    plain: "You never call new on a service in NestJS. You list the class in a module's providers and ask for it in a constructor. Nest builds it and hands it to you. That is dependency injection: the class says what it needs, and Nest supplies it.\n\nThere is one catch. Nest has to be able to see the class from where you ask. A module's providers are private to that module. To share one, the owning module lists it in exports, and the other module lists the owning module in imports.",
    words: [
      [
        'provider',
        'Anything Nest can build and inject. Usually a service class marked @Injectable(), but it can also be a plain value or a factory.',
      ],
      [
        'module',
        'A box that groups providers and controllers, and declares what it imports and exports.',
      ],
      [
        'imports',
        'Other modules whose exported providers this module can use.',
      ],
      [
        'exports',
        'The providers this module makes available to modules that import it.',
      ],
      [
        'token',
        'The key Nest looks up when injecting. Usually the class itself, sometimes a string like "CONFIG".',
      ],
      [
        'scope',
        'How long an instance lives. DEFAULT builds one and shares it, which is called a singleton. REQUEST builds a new one for each request. TRANSIENT gives each class that injects it its own copy.',
      ],
    ],
    code: {
      label: 'the three-part handshake',
      snippet: `@Module({
  providers: [UsersService],   // built here
  exports: [UsersService],     // visible to importers
})
export class UsersModule {}

@Module({
  imports: [UsersModule],      // now OrdersService can inject it
  providers: [OrdersService],
})
export class OrdersModule {}`,
    },
    say: [
      'Providers are private to their module. Exporting one makes it public. Importing the module is how another module asks for it.',
      "When I see \"Nest can't resolve dependencies\", I check three things. Is the class in the providers of the module that owns it? Does that module export it? Is that module imported where I need it? If the error does not name the dependency's class, its type is something Nest cannot see at runtime, like an interface or an `import type`.",
      'By default every provider is a singleton: one instance, built once and shared. Request scope spreads upward. If a service is request-scoped, anything that injects it becomes request-scoped too, and rebuilding all of that per request costs performance.',
      'In tests I build a module with Test.createTestingModule and swap in a fake with overrideProvider and useValue. That one-line swap works because Nest, not my code, decides what gets injected.',
    ],
    gotcha: 'Two modules that each list the same service in providers get two separate instances. If the service holds state, like a cache, the two copies drift apart. Export it from one module and import that module instead.',
    rehearse: [
      {
        prompt: "You get \"Nest can't resolve dependencies of OrdersService\". How do you debug it?",
        answer: 'Three checks, in order. Is the class in the providers of the module that owns it? Does that module export it? Is that module imported where I need it? If the error does not name the dependency\'s class, Nest got nothing it can use at runtime. For an interface, I switch to an injection token. For an `import type`, I change it to a normal import. If two files import each other, I use forwardRef. A missing @Injectable() is a different bug: no error, the dependency is just undefined. If two services need each other, that is forwardRef.',
      },
      {
        prompt: 'What does dependency injection actually buy you here?',
        answer: 'I never build services by hand. So swapping one for a fake in a test is a single overrideProvider call. And the modules\' imports and exports document what depends on what.',
      },
      {
        prompt: 'When would you use a request-scoped provider?',
        answer: 'Rarely. The default singleton is what I want almost every time. Request scope spreads to everything that injects it, and all of that gets rebuilt per request. So I only use it when a provider has to hold state for one request, like the current tenant.',
      },
    ],
  },
  route: {
    plain: 'A controller is a class with a path prefix, like @Controller(\'users\'). Each method gets an HTTP method decorator with the rest of the path, like @Get(\':id\'). Nest joins the two into a route: GET /users/:id.\n\nYou do not dig through one big req object for the inputs. Each piece has its own decorator. @Param reads the URL path, @Query reads the query string, @Body reads the parsed body, and @Headers reads the headers.\n\nReturn an object or an array and Nest sends it as JSON. A plain string goes out as-is, not as JSON.',
    words: [
      ['@Controller("users")', 'Path prefix for every route in the class.'],
      [
        '@Get(":id")',
        'The HTTP method plus the rest of the path. A colon marks a URL parameter, so :id matches any value in that spot.',
      ],
      [
        '@Param / @Query / @Body',
        'Each pulls one piece of the request. With a name you get one value, and with no name you get the whole object.',
      ],
      ['@HttpCode(204)', 'Overrides the default status code for a successful response.'],
      [
        'setGlobalPrefix("api")',
        'Puts a prefix in front of every route in the app.',
      ],
    ],
    code: {
      label: 'a controller worth copying',
      snippet: `@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')                       // declare BEFORE :id
  me(@Headers('authorization') auth: string) {}

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {}

  @Post()                          // 201 by default
  create(@Body() dto: CreateUserDto) {}
}`,
    },
    say: [
      'On Express, routes are matched in declaration order, so a literal path like /users/me has to be declared above /users/:id or the param route swallows it.',
      'POST returns 201 by default, and everything else returns 200. @HttpCode changes that.',
      'I return plain objects and let Nest send them. With @Res() I would have to send the response myself, and anything an interceptor does to the return value would be lost. If I only need a cookie or a header, I use @Res({ passthrough: true }).',
      'ParseIntPipe inside @Param turns the string into a number. If it is not a number, the pipe throws a 400 before the handler runs. So the handler only ever sees valid input.',
    ],
    gotcha: 'Injecting @Res() switches that handler into library-specific mode. Nest stops sending the response, so you have to send it yourself, and returning a value does nothing. Interceptors still run, but anything they do to the returned value is lost. Guards, pipes and filters keep working. Use @Res({ passthrough: true }) when all you need is to set a cookie or a header.',
    rehearse: [
      {
        prompt: 'How do you structure a controller?',
        answer: 'Thin. It maps a route to a service call. It pulls what it needs with @Param, @Query and @Body, and returns a plain object for Nest to send as JSON. The logic lives in the service.',
      },
      {
        prompt: 'What is the trap with route order?',
        answer: 'Nest registers routes in the order they are declared, and on Express the first match wins. So /users/me has to sit above /users/:id, or the param route swallows it. Nest 12 adds opt-in help. routeConflictPolicy can warn or fail at startup when one route shadows another. routeResolutionStrategy: "specificity" registers fixed segments first. Fastify already ranks by specificity, so the sort and the shadow check do nothing there.',
      },
      {
        prompt: 'Walk me through what you type to add GET /orders/:id.',
        answer: 'A class decorated @Controller("orders") and listed in a module, with a method decorated @Get(":id"). I pull the id with @Param("id", ParseIntPipe) so it arrives as a number, call the service, and return the result. Nest sends it as JSON with a 200.',
      },
    ],
  },
  dto: {
    plain: 'A DTO, short for data transfer object, is a class that describes what a request may contain. You put rules from class-validator on its fields, like @IsEmail(). ValidationPipe checks the incoming JSON against those rules before your handler runs. If anything fails, the client gets a 400 with a list of messages, and your code never sees the bad data.\n\nFor ValidationPipe, the DTO has to be a class, not an interface. Interfaces are deleted when TypeScript compiles, so there would be nothing left to read at runtime.\n\nNest 12 also has a schema-first option. You write a Zod, Valibot or ArkType schema instead of a class, and StandardSchemaValidationPipe checks it.',
    words: [
      ['DTO', 'A class describing the shape of input. Not a database entity.'],
      [
        'class-validator',
        'The library behind @IsEmail(), @MinLength(8), @IsOptional() and friends.',
      ],
      ['whitelist', 'Strips any field that has no validation decorator, without an error.'],
      [
        'forbidNonWhitelisted',
        'Instead of stripping unknown fields, reject the request with a 400.',
      ],
      [
        'transform',
        'Turns the plain JSON into a real instance of the DTO class. It also converts a lone route param or query value to its declared type, like number. Fields inside a DTO need @Type(() => Number) or enableImplicitConversion to be converted.',
      ],
      [
        'PartialType',
        'Makes every field of another DTO optional. Handy for PATCH. With Swagger, import it from @nestjs/swagger so the docs see the fields.',
      ],
      [
        'StandardSchemaValidationPipe',
        'Nest 12: built in. Validates Zod, Valibot or ArkType schemas attached with @Body({ schema }), and the same option works on @Query and @Param. The schema-first alternative to class-validator, which is still fully supported.',
      ],
    ],
    code: {
      label: 'the setup that catches bad input',
      snippet: `// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,            // drop unknown fields
  forbidNonWhitelisted: true, // or 400 on them
  transform: true,            // real instance, params converted
}));

// create-user.dto.ts
export class CreateUserDto {
  @IsEmail() email: string;
  @MinLength(8) password: string;
  @IsOptional() @IsInt() age?: number;
}`,
    },
    say: [
      'With ValidationPipe, DTOs are classes, not interfaces. The pipe reads decorator metadata at runtime, and an interface leaves nothing behind.',
      'I turn on whitelist and forbidNonWhitelisted globally so unexpected fields never reach the service layer.',
      'Validation failures come back as a 400 with a message array. The pipe runs before the handler, so the handler can trust its input.',
      'DTOs describe the request. Entities describe the database. Keeping them separate stops internal columns leaking into the API.',
      'Nest 12 adds a schema-first option: a Zod or Valibot schema on @Body({ schema }), checked by StandardSchemaValidationPipe. The class-validator route is still fully supported, so I use whichever the codebase already has.',
    ],
    gotcha: 'Validation decorators do nothing until a ValidationPipe is actually applied. Add it with app.useGlobalPipes in main.ts. It also needs both class-validator and class-transformer installed.',
    rehearse: [
      {
        prompt: 'What is a DTO, and why does it have to be a class?',
        answer: 'It describes the shape of the request. With ValidationPipe it has to be a class. The pipe reads decorator metadata at runtime, and an interface disappears when TypeScript compiles. If the team uses Zod instead, Nest 12 can check the schema directly with StandardSchemaValidationPipe, and then there is no class at all.',
      },
      {
        prompt: 'How do you keep bad input out of your services?',
        answer: 'A global ValidationPipe with whitelist, forbidNonWhitelisted and transform, plus DTOs with class-validator rules. The handler then only ever sees input that already passed.',
      },
      {
        prompt: 'Sketch a CreateUserDto and say how it actually gets enforced.',
        answer: 'A class with decorated fields: @IsEmail() on email, @MinLength(8) on password, @IsOptional() on anything optional. On its own it does nothing. A global ValidationPipe, from useGlobalPipes in main.ts, runs those rules on every body. whitelist drops unknown fields, and transform hands the handler a real instance.',
      },
    ],
  },
  block: {
    plain: 'Nest has five places to put logic that is not about one single endpoint.\n\nMiddleware runs first, before Nest knows which route matched, and works on the raw request. A guard answers one yes-or-no question: may this request continue? A pipe works on one input value, to check it or convert it. An interceptor wraps the handler, so it can start a timer, serve from a cache, or reshape what comes back. An exception filter sits at the end and turns thrown errors into responses.',
    words: [
      [
        'middleware',
        'Runs first, before Nest has picked a handler. Good for request ids, raw body access, and existing Express middleware like helmet.',
      ],
      [
        'guard',
        'Returns true or false. Used for auth, roles and feature flags. It can read route metadata with Reflector.',
      ],
      [
        'pipe',
        'Checks or converts one argument. ParseIntPipe, ValidationPipe, or your own.',
      ],
      [
        'interceptor',
        'Runs code before and after the handler. Used for logging, timing, caching and response shaping.',
      ],
      ['exception filter', 'Catches one type of error with @Catch() and decides the response.'],
      [
        'custom decorator',
        'createParamDecorator builds a handler shortcut like @CurrentUser().',
      ],
    ],
    code: {
      label: 'one of each, for shape',
      snippet: `@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext) {
    const roles = this.reflector.get<string[]>('roles', ctx.getHandler());
    const { user } = ctx.switchToHttp().getRequest();
    return !roles || roles.some(r => user.roles.includes(r));
  }
}

@Injectable()
export class WrapInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    const started = Date.now();
    return next.handle().pipe(
      map(data => ({ data, ms: Date.now() - started })),
    );
  }
}`,
    },
    say: [
      'Guards answer "is this allowed", interceptors wrap the call, pipes handle one input, and filters turn errors into responses.',
      'Auth goes in a guard, not in the service. A guard runs before the pipes and the handler, and it keeps that logic in one place.',
      'Anything that needs both sides of the handler (timing, caching, response envelopes, serialization) belongs in an interceptor. It sees the return value before it becomes JSON and knows which handler ran. Middleware does not.',
      'Middleware is for raw HTTP concerns, like CORS, security headers or a request id. It runs before Nest picks a handler, so it gets no ExecutionContext and cannot read route metadata.',
    ],
    gotcha: 'Guards and interceptors can read route metadata through Reflector. That is how decorators like @Roles() and @Public() work. Middleware cannot, because Nest has not picked the handler yet.',
    rehearse: [
      {
        prompt: 'Where do you put cross-cutting logic in Nest?',
        answer: 'Guards decide allowed or not. Pipes check or convert one input. Interceptors handle anything that needs both sides of the handler. Filters turn errors into responses. Middleware does raw request work before routing.',
      },
      {
        prompt: 'A global auth guard is on. How do you make one route public?',
        answer: 'I put a @Public() decorator on the handler, which sets metadata. The guard reads it with Reflector and returns true early. The exception lives right on the route, and the guard stays global.',
      },
      {
        prompt: 'Give me a real example of each building block.',
        answer: 'Guard: a RolesGuard, or AuthGuard("jwt") from passport. Pipe: ParseIntPipe on a route param, ValidationPipe on bodies. Interceptor: ClassSerializerInterceptor to strip fields, or CacheInterceptor. Filter: a global filter that turns every error into one JSON shape. Middleware: helmet or cookie-parser, applied with app.use.',
      },
    ],
  },
  err: {
    plain: 'When you throw an HttpException, or a built-in subclass like NotFoundException, Nest catches it. It sends back the matching status code with a JSON body. You never touch res.status.\n\nAnything Nest does not recognize, like a plain Error from a library, becomes a 500 with the real message hidden. That is on purpose: internal errors should not leak to clients.',
    words: [
      ['HttpException', 'The base class for HTTP errors: new HttpException(body, status).'],
      [
        'built-in exceptions',
        'NotFound 404, BadRequest 400, Unauthorized 401, Forbidden 403, Conflict 409, UnprocessableEntity 422.',
      ],
      [
        'exception filter',
        'A class marked @Catch() that turns errors into responses.',
      ],
      [
        '@Catch(HttpException)',
        'Catches HttpException and every subclass, like NotFoundException. Bare @Catch() catches everything.',
      ],
      [
        '401 vs 403',
        '401 is "I do not know who you are". 403 is "I know, and no".',
      ],
      [
        'errorCode',
        'Nest 12: a stable, machine-readable code passed in the exception options and sent in the response body, so clients branch on it instead of the message. Left out if you pass your own object as the response body.',
      ],
    ],
    code: {
      label: 'throwing and catching',
      snippet: `// in a service
const user = await this.repo.findOne({ where: { id } });
if (!user) throw new NotFoundException(\`User \${id} not found\`);
// response: 404 { statusCode: 404, message: "User 7 not found", error: "Not Found" }

// one error shape for the whole API, registered with APP_FILTER
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Errors');
  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(err: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.adapterHost; // works on Express or Fastify
    const ctx = host.switchToHttp();
    const isHttp = err instanceof HttpException;
    const status = isHttp ? err.getStatus() : 500;
    if (!isHttp) this.logger.error(err); // this filter replaces Nest's own logging
    httpAdapter.reply(ctx.getResponse(), {
      ok: false,
      status,
      detail: isHttp ? err.getResponse() : 'Internal server error', // keeps your message
    }, status);
  }
}`,
    },
    say: [
      'I throw Nest\'s HTTP exceptions, like NotFoundException, from the service and let Nest turn them into responses. Controllers stay thin. If a service is also used outside HTTP, I throw my own error classes and map them in one filter.',
      'A guard returning false produces a 403. If I need a 401 or a different message, I throw the exception from the guard instead.',
      'Unknown errors become a 500 with the message stripped, which is the right default, and Nest logs the original. A global filter is where I add a consistent error shape. If it catches everything, it has to log too, because it replaces Nest\'s logging.',
      'I keep 401 and 403 straight. 401 means not authenticated. 403 means authenticated, but not allowed.',
    ],
    gotcha: 'Throwing a plain Error gives the client a generic 500 and hides your message. That is good for safety, and Nest\'s built-in filter still logs the original with its stack. If you replace it with your own catch-all filter, that logging is gone unless you add it back.',
    rehearse: [
      {
        prompt: 'How do you handle errors in a Nest service?',
        answer: 'I throw Nest\'s HTTP exceptions, like NotFoundException or ConflictException, and let Nest turn them into status codes. Controllers stay thin. A global filter gives the API one consistent error shape, and it logs if it replaces Nest\'s own filter.',
      },
      {
        prompt: 'What happens when something throws that is not an HttpException?',
        answer: 'It comes back as a 500 with the message hidden, which is the right default for safety. Nest\'s built-in filter logs the original error with its stack, so I can still debug it. If I write my own catch-all filter, I make sure it logs too, because it replaces that built-in one.',
      },
      {
        prompt: 'Which exceptions do you actually reach for, and when?',
        answer: 'NotFoundException when the thing does not exist, BadRequestException when the input is wrong, UnauthorizedException when I do not know who you are, ForbiddenException when I do and you are not allowed, ConflictException when it already exists. I throw them from services and let Nest turn them into responses.',
      },
    ],
  },
  api: {
    plain: 'Every building block in Nest is a small class with one method, and Nest calls that method for you.\n\nA guard implements canActivate and returns true or false. A pipe implements transform and returns the value the handler should get. An interceptor implements intercept. It gets a handle on the route handler and returns a stream of its result. A filter implements catch and writes the response for an error. Middleware implements use and gets the raw request, response and next.\n\nThen you attach it. @UseGuards, @UsePipes, @UseInterceptors and @UseFilters work for the four that know about routes. Middleware is wired up in configure().',
    words: [
      ['ExecutionContext', 'What guards and interceptors get. It holds the request, plus getHandler() and getClass() for reading route metadata.'],
      ['ArgumentsHost', 'What filters get. It wraps the handler arguments, and switchToHttp() gets you req and res.'],
      ['CallHandler', 'What an interceptor gets as next. next.handle() returns an Observable of the handler\'s result. The handler runs when that Observable is subscribed to, and Nest subscribes to whatever intercept returns.'],
      ['Reflector', 'Reads metadata you attached with a decorator, like roles or @Public().'],
      ['APP_GUARD and friends', 'Registers a global guard, pipe, interceptor or filter as a provider, so it can inject dependencies.'],
    ],
    code: {
      label: 'all five, signatures only',
      snippet: `@Injectable()
class RolesGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean { /* true or false */ }
}

@Injectable()
class TrimPipe implements PipeTransform {
  transform(value: unknown, meta: ArgumentMetadata) { return value; }
}

@Injectable()
class TimingInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = Date.now();
    return next.handle().pipe(tap(() => log(Date.now() - start)));
  }
}

@Catch()
class AllErrorsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) { /* write the response */ }
}

@Injectable()
class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) { next(); }
}`,
    },
    say: [
      'Each building block is one interface with one method: canActivate, transform, intercept, catch and use.',
      'A guard returns a boolean, and false becomes a 403. When I want a 401, I throw UnauthorizedException myself.',
      'An interceptor returns next.handle() piped through RxJS. So anything after the handler lives in operators like tap and map.',
      'Global ones that need dependencies go in as APP_GUARD, APP_PIPE, APP_INTERCEPTOR or APP_FILTER providers instead of in main.ts.',
    ],
    gotcha: 'app.useGlobalGuards() in main.ts takes an instance you build yourself, so DI does not build the guard. You can pass in what it needs by hand, like new RolesGuard(app.get(Reflector)), but that gets clumsy fast. Register it as an APP_GUARD provider instead, and Nest injects Reflector or a service for you.',
    rehearse: [
      {
        prompt: 'Sketch a guard from scratch.',
        answer: 'An @Injectable class that implements CanActivate. canActivate gets an ExecutionContext. I call switchToHttp().getRequest() to read the request, check what I need, and return true or false. False becomes a 403. If I need route metadata like roles, I inject Reflector and call getAllAndOverride on the handler and the class. To bind it globally with dependencies, I provide it as APP_GUARD.',
      },
      {
        prompt: 'How does an interceptor actually wrap the handler?',
        answer: 'intercept gets the context and a CallHandler. Code before next.handle() runs before the handler. next.handle() returns an Observable of the result, so code for after goes in RxJS operators: tap to log, map to reshape, catchError to recover. If I never call next.handle(), the handler never runs. That is how a cache can answer from memory.',
      },
      {
        prompt: 'Walk me through writing an exception filter.',
        answer: 'A class marked @Catch() that implements ExceptionFilter. @Catch lists the exception types it handles, or nothing to catch everything. catch(exception, host) switches the host to HTTP to get the response. It works out the status, usually exception.getStatus() on an HttpException, and writes the JSON. If I only want logging on top of the default, I extend BaseExceptionFilter, call super.catch, and register it with APP_FILTER.',
      },
    ],
  },
  auth: {
    plain: 'Auth in Nest has a shape that survives whichever library you use. At login you check a password against a stored hash and hand back a token.\n\nOn every request after that, a guard reads the token, proves it is genuine, and puts the user on the request. Other guards, like a roles guard, then decide whether that user may do this particular thing. Routes that should be open say so with metadata, usually a @Public() decorator, and the guard checks for it first.',
    words: [
      ['authentication', 'Who are you. Failing it is a 401.'],
      ['authorization', 'May you do this. Failing it is a 403.'],
      ['JWT', 'A signed token. Anyone with the key can verify it without a database lookup. Signed, not encrypted.'],
      ['strategy', 'In Passport, the class that checks one kind of credential. Whatever its validate() returns becomes req.user.'],
      ['@Public()', 'Metadata on a route, read by a global guard with Reflector, that lets the request through without a token.'],
    ],
    code: {
      label: 'a global JWT guard with a public escape hatch',
      snippet: `export const IS_PUBLIC = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC, true);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwt: JwtService, private reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const open = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (open) return true;

    const req = ctx.switchToHttp().getRequest();
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    if (type?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException();
    }
    try {
      req.user = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}

// registered once, for the whole app:
// providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }]`,
      note: 'The Nest docs now lead with @nestjs/authentication, a newer first-party package (still 0.x). It ships its own global guard, @Public() and @CurrentUser(), and it still puts the user on req.user. It also adds AuthenticationContext, which any service can inject to read the current user without being handed the request. Passport with @nestjs/jwt is what most existing codebases use. The shape is the same either way.',
    },
    say: [
      'Authentication is who you are and fails with a 401. Authorization is what you may do and fails with a 403.',
      'I put auth in a guard, registered globally with APP_GUARD, so everything is locked by default and open routes opt out with a @Public() decorator.',
      'The guard verifies the token and puts the user on req.user, and a @CurrentUser() decorator hands it to handlers.',
      'Passwords are stored as a slow, salted hash, like bcrypt or argon2, and compared at login. Nothing ever decrypts them.',
    ],
    gotcha: 'A JWT is signed, not encrypted. Anyone holding one can decode the payload and read it, so it should carry an id and maybe roles, never anything secret. Roles in a token can also go stale. Demote an admin, and their old token still says admin until it expires. Keep tokens short-lived, or check the database for anything sensitive.',
    rehearse: [
      {
        prompt: 'Walk me through JWT auth in a Nest app, from login to a protected request.',
        answer: 'Login finds the user by email, compares the password against the stored hash, and signs a JWT with the user id as sub. The client sends it back as Authorization: Bearer. A guard, often AuthGuard("jwt") with a Passport strategy, verifies the signature and expiry. It puts the user on req.user, and handlers read it, usually through a @CurrentUser() decorator.',
      },
      {
        prompt: 'How do you handle public routes when auth is global?',
        answer: 'I register the auth guard globally with APP_GUARD so everything is locked by default. Open routes get a @Public() decorator built with SetMetadata. The guard checks it with reflector.getAllAndOverride on the handler and the class, and returns true early. The safe default stays safe, and every exception is visible right on the route.',
      },
      {
        prompt: 'What is the difference between a 401 and a 403, and where does each come from?',
        answer: '401 means we do not know who you are: no token, a bad one or an expired one, and the auth guard throws UnauthorizedException. 403 means we know exactly who you are and the answer is no, like a missing role, which is what a guard returning false gives you.',
      },
    ],
  },
  test: {
    plain: 'Nest gives you one tool for testing: a testing module. You describe it like any module, with the providers and controllers you need, swap out anything you do not want to run for real, and compile it. From there you either pull out one class and call its methods, which is a unit test, or turn the whole thing into an app and send it real HTTP requests with supertest, which is an end-to-end test. The runner barely matters: Nest 12\'s ESM scaffold defaults to Vitest, CommonJS scaffolds and many existing codebases use Jest. The mock functions and the runner\'s config differ, and the Nest side is identical.',
    words: [
      ['Test.createTestingModule', 'Takes @Module() style metadata and returns a builder. compile() gives you a TestingModule.'],
      ['overrideProvider', 'Swaps a real dependency for a fake with useValue, useClass or useFactory. overrideGuard and friends do the same for the building blocks.'],
      ['moduleRef.get', 'Pulls a fully wired instance out of the testing module. Use resolve() for request-scoped ones.'],
      ['supertest', 'Sends real HTTP requests to app.getHttpServer(). If the server is not listening, it starts it on a random free port, so you never pick one.'],
      ['e2e test', 'Boots the app and tests it over HTTP, the way a client would.'],
    ],
    code: {
      label: 'a unit test and an e2e test, side by side',
      snippet: `// unit: one class, its dependencies faked
const moduleRef = await Test.createTestingModule({
  providers: [OrdersService, PaymentsService],
})
  .overrideProvider(PaymentsService)
  .useValue({ charge: vi.fn().mockResolvedValue({ ok: true }) })
  .compile();

const orders = moduleRef.get(OrdersService);
await expect(orders.place(cart)).resolves.toMatchObject({ status: 'paid' });

// e2e: the whole app, over HTTP
const app = (await Test.createTestingModule({ imports: [AppModule] }).compile())
  .createNestApplication();
await app.init();
await request(app.getHttpServer()).get('/orders').expect(200);
await app.close();`,
      note: 'vi.fn() is Vitest. In a Jest codebase it is jest.fn(), and nothing else here changes.',
    },
    say: [
      'I build a testing module with only what the test needs, override anything that touches the outside world, and pull the class under test out with moduleRef.get.',
      'The thing I am testing stays real. Its edges, databases, HTTP calls and queues, get faked.',
      'E2E tests boot the app with createNestApplication and hit it with supertest through app.getHttpServer, so I never call listen() or pick a port.',
      'Nest\'s testing API does not care about the runner. The ESM scaffold defaults to Vitest, CommonJS and many repos use Jest, and only the mock syntax and the runner\'s config change.',
    ],
    gotcha: 'overrideProvider lives on the builder, so it has to be chained before compile(). Once the module is compiled the graph is built, and there is nothing left to override.',
    rehearse: [
      {
        prompt: 'How do you unit test a service that depends on a repository?',
        answer: 'I build a testing module with the service and give the repository a fake, through overrideProvider or a provider with useValue, usually an object of mock functions. Then I get the service with moduleRef.get and call its methods directly, asserting on what comes back and on what the fake was called with. The service is real, everything it talks to is not.',
      },
      {
        prompt: 'Walk me through an e2e test in Nest.',
        answer: 'createTestingModule importing AppModule, overrideProvider for anything that talks to the outside world, compile, then createNestApplication and init. I send requests with supertest against app.getHttpServer, assert on status and body, and close the app in afterAll so the runner can exit.',
      },
      {
        prompt: 'What do you mock, and what do you leave real?',
        answer: 'I keep the thing under test real and fake its edges: databases, HTTP calls, queues, the clock. Mocking the code I am testing proves nothing. In e2e tests I keep as much real as I can and only swap what I cannot run in a test, like a payment provider.',
      },
    ],
  },
};
